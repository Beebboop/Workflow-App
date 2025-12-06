/* eslint-disable prettier/prettier */
// @ts-nocheck

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

///////////////////////////Boundary Value Analysis///////////////////////////////////////

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../user.entity';
import { RegisterDto } from '../../../../types/src/user';

jest.mock('bcrypt');

describe('AuthService - Boundary Value Analysis', () => {
  let authService: AuthService;
  let usersRepository: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'), //JWT подпись
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);

    // Mock bcrypt
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
  });

  describe('Граничные тесты(BVA) на длину пароля', () => {
    const testCases = [
      { length: 3, shouldPass: false, description: '3 знака - ниже минимума' },
      { length: 4, shouldPass: true, description: '4 знака - граница минимума' },
      { length: 12, shouldPass: true, description: '12 знаков - среднее количество знаков ' },
      { length: 20, shouldPass: true, description: '20 знаков - максимальная граница' },
      { length: 21, shouldPass: false, description: '21 знак - выше максимума' },
    ];

    testCases.forEach(({ length, shouldPass, description }) => {
      it(`должен ${shouldPass ? 'принять' : 'отклонить'} пароль по причине: ${description}`, async () => {

        const password = 'a'.repeat(length);
        const registerDto: RegisterDto = {
          name: 'Test User',
          email: 'test@example.com',
          password: password,
        };


        if (shouldPass) {
          usersRepository.findOne.mockResolvedValue(null);
          usersRepository.create.mockReturnValue(registerDto);
          usersRepository.save.mockResolvedValue({ ...registerDto, id: 'user-123' });
        }


        if (shouldPass) {
          await expect(authService.register(registerDto)).resolves.toBeDefined();
        } else {
          await expect(authService.register(registerDto)).rejects.toThrow();

        }
      });
    });
  });


  describe('Граничные тесты (BVA) на длину имени с trim', () => {
    const testCases = [
        { inputName: '   abc   ', length: 3, shouldPass: false, description: 'Имя с пробелами, длина 3 после trim — ниже минимума' },
        { inputName: '   abcd   ', length: 4, shouldPass: true, description: 'Имя с пробелами, длина 4 после trim — на минимуме' },
        { inputName: '   abcefg   ', length: 6, shouldPass: true, description: 'Имя с пробелами, длина 6 после trim — выше минимума' },
        { inputName: '   abcdefghabcdefghabcdefgh   ', length: 24, shouldPass: false, description: 'Имя с пробелами, длина 24 после trim — выше максимума' },
        { inputName: 'J'.repeat(20), length: 20, shouldPass: true, description: 'Длина 20 — максимум' },
        { inputName: 'J'.repeat(21), length: 21, shouldPass: false, description: 'Длина 21 — выше максимума' },
        { inputName: 'W'.repeat(3), length: 3, shouldPass: false, description: 'Длина 3 — ниже минимума' },
        { inputName: 'W'.repeat(4), length: 4, shouldPass: true, description: 'Длина 4 — на минимуме' },
    ];

    testCases.forEach(({ inputName, shouldPass, description }) => {
        it(`должен ${shouldPass ? 'принять' : 'отклонить'} имя по причине: ${description}`, async () => {
        const registerDto: RegisterDto = {
            name: inputName,
            email: 'test@example.com',
            password: 'validPassword123',
        };

        if (shouldPass) {
            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue(registerDto);
            usersRepository.save.mockResolvedValue({ ...registerDto, id: 'user-123' });
        }

        if (shouldPass) {
            await expect(authService.register(registerDto)).resolves.toBeDefined();
        } else {
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
        }
        });
    });
    });
});