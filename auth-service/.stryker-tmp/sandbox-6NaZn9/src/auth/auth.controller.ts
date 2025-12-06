/* eslint-disable prettier/prettier */
// @ts-nocheck

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Controller, Post, Body, Get, UseGuards, Put, Request, Param, Headers, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, User, UpdateUserDto } from '../../types/src/user';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { JwtPayload } from '../../types/src/jwt-payloads'

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('users/:userId')
  async getUserById(@Param('userId') userId: string) {
    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Put('users/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @Headers('x-user-id') headerUserId: string
  ) {
    // Проверяем, что пользователь обновляет свой собственный профиль
    if (userId !== headerUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Обновляем пользователя
    const updatedUser = await this.authService.updateUser(userId, updateUserDto);
    return updatedUser;
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsers(): Promise<User[]> {
    return this.authService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refreshToken(@Request() req: RequestWithUser) {
    return this.authService.refreshToken(req.user);
  }

  @Get('health')
  healthCheck() {
    return { status: 'OK', service: 'auth-service' };
  }
}