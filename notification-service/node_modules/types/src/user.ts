/* eslint-disable prettier/prettier */
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
  email: string = '';
  password: string = '';

  constructor(data?: Partial<LoginDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class RegisterDto {
  email: string = '';
  password: string = '';
  name: string = '';

  constructor(data?: Partial<RegisterDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class UpdateUserDto {
  name?: string;
}

