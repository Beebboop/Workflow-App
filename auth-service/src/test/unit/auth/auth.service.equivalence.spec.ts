/* eslint-disable prettier/prettier */
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
                remove: jest.fn(),
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

    
    //провести отдельно сначала до мутационные, потом после 1 и показать улучшение результата 

    describe('Тесты после выявленных первой мутацией уязвимостей  ', () => {
        it('должен отклонить email, который не начинается с начала строки (убивает мутацию regex без ^)', async () => {
            const registerDto: RegisterDto = {
                name: 'Test',
                email: ' test@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Invalid email format');
        });
        it('должен отклонить email, который продолжается после точки (убивает мутацию без $)', async () => {
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'test@example.com invalid',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Invalid email format');
        });
        it('должен выбросить исключение с точным сообщением при невалидном email', async () => {
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'invalid-email',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Invalid email format');
        });
        it('должен предотвратить регистрацию, если findOne вернёт пользователя по неправильному запросу (мокаем findOne с where: {})', async () => {
            usersRepository.findOne.mockResolvedValue({ id: 'wrong-user' }); // Имитируем, что находит даже без email
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('User with this email already exists');
        });
        it('должен выбросить точное сообщение при существующем пользователе', async () => {
            usersRepository.findOne.mockResolvedValue({ id: 'existing' });
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('User with this email already exists');
        });

        it('должен предотвратить регистрацию, если where в findOne пуст', async () => {
            usersRepository.findOne.mockResolvedValue({ id: 'random-user' });
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'new@example.com',
                password: 'validPass',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(ConflictException); 
        });
        it('должен провалить create с пустым объектом', async () => {
            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue({});
            usersRepository.save.mockResolvedValue({ id: 'user-123' });
            const registerDto: RegisterDto = {
                name: 'Test',
                email: 'unique@example.com',
                password: 'validPass',
            };
            const result = await authService.register(registerDto);
            expect(result).toBeDefined();
            expect(usersRepository.create).toHaveBeenCalledWith({ ...registerDto, password: 'hashedPassword' }); 
        });
        
        it('должен удалить пользователя в deleteUser', async () => {
            const mockUser = { 
                id: '123', 
                email: 'test@example.com',
                name: 'Test User'
            };
            usersRepository.findOne.mockResolvedValue(mockUser);

             usersRepository.remove.mockResolvedValue(mockUser);

            await authService.deleteUser('123');

            expect(usersRepository.findOne).toHaveBeenCalledWith({
                where: { id: '123' }
            });

            expect(usersRepository.remove).toHaveBeenCalledWith(mockUser);
        });

        it('должен выбросить исключение с точным сообщением "Invalid email or password" при неверном email в login', async () => {
            usersRepository.findOne.mockResolvedValue(null);
            const loginDto: LoginDto = {
                email: 'wrong@example.com',
                password: 'password123',
            };
            
            await expect(authService.login(loginDto))
                .rejects.toThrow(UnauthorizedException);
            await expect(authService.login(loginDto))
                .rejects.toThrow('Invalid email or password');
        });

        it('должен выбросить исключение с точным сообщением "Invalid email or password" при неверном пароле в login', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashedPassword',
                name: 'Test User',
            };
            
            usersRepository.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };
            
            await expect(authService.login(loginDto))
                .rejects.toThrow(UnauthorizedException);
            await expect(authService.login(loginDto))
                .rejects.toThrow('Invalid email or password');
        });
        
        it('должен искать пользователя по email при регистрации', async () => {
            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue({});
            usersRepository.save.mockResolvedValue({ id: 'user-123' });
            
            const registerDto: RegisterDto = {
                name: 'Test User',
                email: 'unique@example.com',
                password: 'password123',
            };
            
            await authService.register(registerDto);
            
            // Проверяем, что findOne вызван с правильным where
            expect(usersRepository.findOne).toHaveBeenCalledWith({
                where: { email: 'unique@example.com' }
            });
        });

        it('должен искать пользователя по email при login', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashedPassword',
                name: 'Test User',
            };
            
            usersRepository.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'password123',
            };
            
            await authService.login(loginDto);
            
            expect(usersRepository.findOne).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
        });
    });
});