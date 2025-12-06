/* eslint-disable prettier/prettier */
// @ts-nocheck

import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  password: string;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string = '';

  @IsString()
  password: string = '';

  constructor(data?: Partial<LoginDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string = '';

  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters' })
  password: string = '';

  @IsString()
  @MinLength(4, { message: 'Name must be at least 4 characters long' })
  @MaxLength(30, { message: 'Name must not exceed 20 characters' })
  @IsOptional()
  name: string = '';

  constructor(data?: Partial<RegisterDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;
}