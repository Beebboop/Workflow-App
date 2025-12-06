/* eslint-disable prettier/prettier */
// @ts-nocheck

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user.entity';

export class TestUtils {
  static createMockUser(overrides?: Partial<User>): User {
    return {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword',
      role: 'user',
      createdAt: new Date(),
      ...overrides,
    } as User;
  }

  static createMockRepository() {
    return {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  }

  static async createTestingModule(providers: any[]) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ...providers,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    return module;
  }
}