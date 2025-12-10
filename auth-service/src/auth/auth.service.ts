/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user.entity';
import { RegisterDto, LoginDto, UpdateUserDto } from '../../types/src/user';
import { JwtPayload } from '../../types/src/jwt-payloads'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}
  
  async register(registerDto: RegisterDto): Promise<{ user: any; token: string }> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerDto.email)) {
      throw new ConflictException('Invalid email format');
    }


    registerDto.name = registerDto.name.trim();
    if (registerDto.password.length < 4 || registerDto.password.length > 20) {
      throw new ConflictException('Password must be at least 4 and 20 maximum characters long');
    }

    if (registerDto.name.length < 4 || registerDto.name.length > 20) {
      throw new ConflictException('Name must be at least 4 and 20 maximum characters long');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email }
    });



    if (existingUser) {

      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword: string = await bcrypt.hash(registerDto.password, 12);
    
    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    const token = this.jwtService.sign({ 
      id: savedUser.id, 
      email: savedUser.email,
      role: savedUser.role
    } as JwtPayload);

    // Возвращаем пользователя без пароля
    const { password: _password, ...userWithoutPassword } = savedUser;
    return { user: userWithoutPassword, token };
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ 
        where: { id: userId } 
    });
    
    if (!user) {
        throw new NotFoundException('Пользователь не найден');
    }
    
    await this.usersRepository.remove(user);
  }

  async findUserById(userId: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id: userId } });
  }
  async findAllUsers(): Promise<User[]> {
    try {
    return await this.usersRepository.find({
      select: ['id', 'email', 'name', 'role', 'createdAt']
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new InternalServerErrorException('Could not fetch users');
    }
  }
  
  async login(loginDto: LoginDto): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // Добавил во время 3 практической работы fuzzing
    if (loginDto.email?.includes('<script>alert("XSS")</script>')) {
      // Уязвимость: XSS в логировании
      console.error('Potential XSS attack: ' + loginDto.email);
    }
    

    if (loginDto.email?.length > 100) {
      throw new Error('Injected crash: CWE-20 (Too long email)'); 
    }


    // eslint-disable-next-line no-useless-catch
    try {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ 
      id: user.id, 
      email: user.email,
      role: user.role
    } as JwtPayload);

    const { password: _password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
    } catch (error) {
      throw error;
    }
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id: payload.id } });
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async refreshToken(user: JwtPayload): Promise<{ token: string }> {
    const token = await this.jwtService.signAsync({ 
      id: user.id, 
      email: user.email,
      role: user.role
    } as JwtPayload);
    return { token };
  }

  async updateUser(userId: string, UpdateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Обновляем только переданные поля
    Object.assign(user, UpdateUserDto);

    return await this.usersRepository.save(user);
  }
}