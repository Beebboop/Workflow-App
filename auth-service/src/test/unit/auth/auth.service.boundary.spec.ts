/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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

    describe('Тесты после выявленных первой мутацией уязвимостей  ', () => {

        it('должен выбросить исключение с точным сообщением для пароля меньше 4 символов', async () => {
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'abc', 
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Password must be at least 4 and 20 maximum characters long');
        });
        it('должен выбросить исключение с точным сообщением для пароля больше 20 символов', async () => {
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'a'.repeat(21), 
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Password must be at least 4 and 20 maximum characters long');
        });

        it('должен выбросить исключение с точным сообщением для имени короче 4 символов', async () => {
            const registerDto: RegisterDto = {
                name: 'Abc', 
                email: 'test@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Name must be at least 4 and 20 maximum characters long');
        });
        it('должен корректно обрабатывать границу, где длина = 4 (минимум, чтобы убить изменения в ||)', async () => {
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'test@example.com',
                password: '1234', 
            };
            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue(registerDto);
            usersRepository.save.mockResolvedValue({ ...registerDto, id: 'user-123' });
            await expect(authService.register(registerDto)).resolves.toBeDefined();
        });
        it('должен корректно обрабатывать границу, где длина = 20 (максимум)', async () => {
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'a'.repeat(20), 
            };
            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue(registerDto);
            usersRepository.save.mockResolvedValue({ ...registerDto, id: 'user-123' });
            await expect(authService.register(registerDto)).resolves.toBeDefined();
        });


        it('должен предотвратить регистрацию, если findOne с пустым where находит случайного пользователя (убивает мутацию findOne без where)', async () => {
            usersRepository.findOne.mockResolvedValue({ id: 'wrong-user' }); 
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'unique@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException); 
        });
        
        it('должен вернуть пользователя по id с границей (без покрытия)', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            usersRepository.findOne.mockResolvedValue(mockUser);
            const result = await authService.findUserById('123');
            expect(result).toEqual(mockUser);
            expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: '123' } }); 
        });
                
    });
});