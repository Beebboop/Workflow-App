/* eslint-disable prettier/prettier */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PublicGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Проверяем, есть ли декоратор @Public
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler()
    );
    
    if (isPublic) {
      return true;
    }

    return false;
  }
}