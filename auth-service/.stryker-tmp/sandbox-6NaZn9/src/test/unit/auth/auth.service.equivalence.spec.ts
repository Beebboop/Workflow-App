/* eslint-disable prettier/prettier */
// @ts-nocheck

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */


import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../user.entity';
import { LoginDto, RegisterDto } from '../../../../types/src/user';

jest.mock('bcrypt');

describe('AuthService - Equivalence Analysis', () => {
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

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
  });

  describe('Проверка адреса электронной почты на соответствие формату', () => {
    const testCases = [
      { email: 'invalid', shouldPass: false, description: 'отсутствует символ @' },
      { email: 'invalid@', shouldPass: false, description: 'отсутствует домен' },
      { email: '@example.com', shouldPass: false, description: 'отсутствует локальная часть адреса почты' },
      { email: 'test@example', shouldPass: false, description: 'отсутствует домен верхнего уровня' },
      { email: 'test@example.com', shouldPass: true, description: 'валидная форма почты' },
    ];

    testCases.forEach(({ email, shouldPass, description }) => {
      it(`должен ${shouldPass ? 'принять' : 'отклонить'} электронную почту по причине: ${description}`, async () => {

        const registerDto: RegisterDto = {
          name: 'Test User',
          email: email,
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
          await expect(authService.register(registerDto)).rejects.toThrow();

        }
      });
    });
  });


  describe('Регистрация пользователя equivalence classes', () => {
    const testCases = [
      {
        description: 'Новый уникальный пользователь',
        setup: () => {
          usersRepository.findOne.mockResolvedValue(null);
          usersRepository.create.mockReturnValue({});
          usersRepository.save.mockResolvedValue({ id: 'user-123' });
        },
        shouldPass: true,
      },
      {
        description: 'Существующий адрес электронной почты пользователя',
        setup: () => {
          usersRepository.findOne.mockResolvedValue({ id: 'existing-user' });
        },
        shouldPass: false,
        expectedError: ConflictException,
      },
    ];

    testCases.forEach(({ description, setup, shouldPass, expectedError }) => {
      it(`должен ${shouldPass ? 'допустить' : 'предотвратить'} регистрацию по причине ${description}`, async () => {

        setup();
        const registerDto: RegisterDto = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        };

        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

        if (shouldPass) {
          const result = await authService.register(registerDto);
          expect(result).toBeDefined();
          expect(result.token).toBe('mock-jwt-token');
        } else {
          await expect(authService.register(registerDto))
            .rejects.toThrow(expectedError);
        }
      });
    });
  });

  describe('Пользовательский вход equivalence classes', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
    };

    const testCases = [
      {
        description: 'Несуществующий пользователь',
        setup: () => {
          usersRepository.findOne.mockResolvedValue(null);
        },
        shouldPass: false,
        expectedError: UnauthorizedException,
      },
      {
        description: 'Неправильный пароль',
        setup: () => {
          usersRepository.findOne.mockResolvedValue(mockUser);
          (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        },
        shouldPass: false,
        expectedError: UnauthorizedException,
      },
      {
        description: 'Правильные учетные данные',
        setup: () => {
          usersRepository.findOne.mockResolvedValue(mockUser);
          (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        },
        shouldPass: true,
      },
    ];

    testCases.forEach(({ description, setup, shouldPass, expectedError }) => {
      it(`должен ${shouldPass ? 'допустить' : 'предотвратить'} логин по причине ${description}`, async () => {
        setup();
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'password123',
        };

        if (shouldPass) {
          const result = await authService.login(loginDto);
          expect(result).toBeDefined();
          expect(result.token).toBe('mock-jwt-token');
        } else {
          await expect(authService.login(loginDto))
            .rejects.toThrow(expectedError);
        }
      });
    });
  });

  
  describe('Тесты после выявленных первой мутацией уязвимостей  ', () => {
    describe('Валидация email с пробелами', () => {
        it('должен отклонять email с пробелом в начале', async () => {
        const registerDto: RegisterDto = {
            name: 'Test User',
            email: ' test@example.com', // Пробел в начале
            password: 'validPassword123',
        };

        usersRepository.findOne.mockResolvedValue(null);
        
        await expect(authService.register(registerDto))
            .rejects
            .toThrow(new ConflictException('Invalid email format'));
        });

        it('должен отклонять email с пробелом в конце', async () => {
        const registerDto: RegisterDto = {
            name: 'Test User',
            email: 'test@example.com ', // Пробел в конце
            password: 'validPassword123',
        };

        usersRepository.findOne.mockResolvedValue(null);
        
        await expect(authService.register(registerDto))
            .rejects
            .toThrow(new ConflictException('Invalid email format'));
        });
    });

    describe('Проверка логических операторов', () => {
        it('должен отклонять пароль длиной 3 символа', async () => {
            const registerDto: RegisterDto = {
                name: 'Test User',
                email: 'test@example.com',
                password: '123', // 3 символа - короткий пароль
            };

            usersRepository.findOne.mockResolvedValue(null);
            
            await expect(authService.register(registerDto))
                .rejects
                .toThrow(new ConflictException('Password must be at least 4 and 20 maximum characters long'));
        });

        it('должен отклонять пароль длиной 21 символ', async () => {
            const registerDto: RegisterDto = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'a'.repeat(21), // 21 символ - слишком длинный пароль
            };

            usersRepository.findOne.mockResolvedValue(null);
            
            await expect(authService.register(registerDto))
                .rejects
                .toThrow(new ConflictException('Password must be at least 4 and 20 maximum characters long'));
            });
        });
    });

    describe('Тестирование запросов к базе данных', () => {
        it('должен искать пользователя по конкретному email', async () => {
            const registerDto: RegisterDto = {
            name: 'Test User',
            email: 'specific@example.com',
            password: 'validPassword123',
            };

            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue(registerDto);
            usersRepository.save.mockResolvedValue({ ...registerDto, id: 'user-123' });

            await authService.register(registerDto);

            // Проверяем, что findOne был вызван с правильным email
            expect(usersRepository.findOne).toHaveBeenCalledWith({
            where: { email: 'specific@example.com' }
            });
        });

        it('должен создавать пользователя с хешированным паролем', async () => {
            const registerDto: RegisterDto = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'plainPassword',
            };

            usersRepository.findOne.mockResolvedValue(null);
            const mockUser = { ...registerDto, password: 'hashedPassword', id: 'user-123' };
            usersRepository.create.mockReturnValue(mockUser);
            usersRepository.save.mockResolvedValue(mockUser);

            await authService.register(registerDto);

            // Проверяем, что bcrypt.hash был вызван
            expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 12);
            
            // Проверяем, что create был вызван с хешированным паролем
            expect(usersRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                password: 'hashedPassword'
                })
            );
        });
    });
});