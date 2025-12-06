/* eslint-disable prettier/prettier */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../types/src';
import { Reflector } from '@nestjs/core';


interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };
  user?: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);
    if (isPublic) {
      console.log('Allowing access to public route');
      return true;
    }
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      // Валидируем токен через Auth Service
      const authResponse: AxiosResponse<User> = await firstValueFrom(
        this.httpService.get(`${process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      // Добавляем пользователя к запросу
      request.user = authResponse.data;
      
    } catch (error) {
      throw new UnauthorizedException(error, 'Invalid token');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: AuthenticatedRequest): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}