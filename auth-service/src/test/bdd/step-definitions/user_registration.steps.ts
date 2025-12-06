/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { loadFeature, defineFeature } from 'jest-cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../user.entity';
import { UserRole } from 'types/src';

const feature = loadFeature('./src/test/bdd/features/user_registration.feature');

// Мок для bcrypt
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();

jest.mock('bcrypt', () => ({
    compare: (...args: any[]) => mockBcryptCompare(...args),
    hash: (...args: any[]) => mockBcryptHash(...args),
}));

defineFeature(feature, (test) => {
    let authService: AuthService;
    let usersRepository: any;
    let jwtService: JwtService;
    let lastResponse: any;
    let lastError: Error;

    beforeEach(async () => {
        // Сбрасываем моки
        mockBcryptCompare.mockReset();
        mockBcryptHash.mockReset();
        
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
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        usersRepository = module.get(getRepositoryToken(User));
        jwtService = module.get<JwtService>(JwtService);

        // Настройка моков по умолчанию
        mockBcryptHash.mockResolvedValue('hashedPassword123');
        usersRepository.create.mockImplementation((data: any) => ({
            ...data,
            id: 'new-user-id',
            role: UserRole.USER,
            createdAt: new Date(),
        }));
        usersRepository.save.mockImplementation((user: any) => Promise.resolve(user));
    });

    test('Успешная регистрация нового пользователя', ({ given, when, then, and }) => {
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        given('база данных пользователей пуста', () => {
            usersRepository.findOne.mockResolvedValue(null);
        });

        given(
            /^я заполняю форму регистрации с данными:$/,
            (table: Array<{ Поле: string; Значение: string }>) => {
                const data = table.reduce((acc, row) => {
                    const key = row.Поле.toLowerCase();
                    acc[key] = row.Значение;
                    return acc;
                }, {} as any);
                (this as any).registrationData = data;
            }
        );

        when('я отправляю форму регистрации', async () => {
            try {
                lastResponse = await authService.register({
                    name: (this as any).registrationData.имя,
                    email: (this as any).registrationData.email,
                    password: (this as any).registrationData.пароль,
                });
            } catch (error) {
                lastError = error as Error;
            }
        });

        then('я должен получить JWT токен', () => {
            expect(lastResponse.token).toBe('mock-jwt-token');
        });

        and('пользователь должен быть сохранен в базе данных', () => {
            expect(usersRepository.save).toHaveBeenCalled();
        });

        and('в ответе должен быть объект пользователя без пароля', () => {
            expect(lastResponse.user).toBeDefined();
            expect(lastResponse.user.password).toBeUndefined();
            expect(lastResponse.user.name).toBe((this as any).registrationData.имя);
            expect(lastResponse.user.email).toBe((this as any).registrationData.email);
        });
    });

    test('Попытка регистрации с уже существующим email', ({ given, when, then, and }) => {
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        and('база данных пользователей пуста', () => {
            
        });

        given(/^пользователь с email "(.*)" уже зарегистрирован$/, (email: string) => {
            usersRepository.findOne.mockResolvedValue({
                id: 'existing-user',
                email: email,
                name: 'Existing User',
                password: 'hashedPassword',
                role: UserRole.USER,
                createdAt: new Date(),
            });
        });

        when(/^я пытаюсь зарегистрироваться с email "(.*)"$/, async (email: string) => {
            try {
                lastResponse = await authService.register({
                    name: 'Test User',
                    email: email,
                    password: 'password123',
                });
            } catch (error) {
                lastError = error as Error;
            }
        });

        then('я должен получить ошибку конфликта', () => {
            expect(lastError).toBeInstanceOf(ConflictException);
        });

        and(/^система должна вернуть сообщение "(.*)"$/, (message: string) => {
            expect((lastError as any).message).toBe(message);
        });
    });
    
    test('Регистрация с паролем недопустимой длины', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        and('база данных пользователей пуста', () => {
            usersRepository.findOne.mockResolvedValue(null);
        });

        given(/^я ввожу пароль длиной (.*) символов$/, (length: string) => {
            const passwordLength = parseInt(length);
            (this as any).testPassword = 'a'.repeat(passwordLength);
        });

        when('я пытаюсь зарегистрироваться', async () => {
            try {
                lastResponse = await authService.register({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: (this as any).testPassword,
                });
            } catch (error) {
                lastError = error as Error;
            }
        });

        then('я должен получить ошибку валидации пароля', () => {
            const passwordLength = (this as any).testPassword.length;
            if (passwordLength < 4 || passwordLength > 20) {
                expect(lastError).toBeInstanceOf(ConflictException);
                expect((lastError as any).message).toContain('Password must be');
            } else {
                expect(lastResponse).toBeDefined();
            }
        });
    });

    test('Регистрация с некорректным email', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        and('база данных пользователей пуста', () => {
            usersRepository.findOne.mockResolvedValue(null);
        });

        given(/^я ввожу некорректный email "(.*)"$/, (email: string) => {
            (this as any).testEmail = email;
        });

        when('я пытаюсь зарегистрироваться', async () => {
            try {
                lastResponse = await authService.register({
                    name: 'Test User',
                    email: (this as any).testEmail,
                    password: 'ValidPass123',
                });
            } catch (error) {
                lastError = error as Error;
            }
        });

        then('я должен получить ошибку валидации', () => {
            expect(lastError).toBeInstanceOf(ConflictException);
        });

        and(/^система должна вернуть сообщение "(.*)"$/, (message: string) => {
            expect((lastError as any).message).toBe(message);
        });
    });
});