import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { RegisterDto, LoginDto, UpdateUserDto } from '../../types/src/user';
import { JwtPayload } from '../../types/src/jwt-payloads';
export declare class AuthService {
    private usersRepository;
    private jwtService;
    constructor(usersRepository: Repository<User>, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        user: any;
        token: string;
    }>;
    deleteUser(userId: string): Promise<void>;
    findUserById(userId: string): Promise<User | null>;
    findAllUsers(): Promise<User[]>;
    login(loginDto: LoginDto): Promise<{
        user: Omit<User, 'password'>;
        token: string;
    }>;
    validateUser(payload: JwtPayload): Promise<User | null>;
    getProfile(userId: string): Promise<Omit<User, 'password'>>;
    refreshToken(user: JwtPayload): Promise<{
        token: string;
    }>;
    updateUser(userId: string, UpdateUserDto: UpdateUserDto): Promise<User>;
}
