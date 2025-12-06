/* eslint-disable prettier/prettier */
// @ts-nocheck

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../types/src/jwt-payloads'
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler()
    );
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (isPublic) {
      return true;
    }
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'KSmrsWqq1',
      });
      
      // Добавляем payload к запросу
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}