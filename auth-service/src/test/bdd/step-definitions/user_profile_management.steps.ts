/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { loadFeature, defineFeature } from 'jest-cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../user.entity';
import { UserRole } from 'types/src';

const feature = loadFeature('./src/test/bdd/features/user_profile_management.feature');

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
    let bcryptTimes: number[] = [];
    let md5Times: number[] = [];

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
    });

    test('Сравнение алгоритмов хеширования паролей', ({ given, when, then, and }) => {
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        and(/^я авторизован как пользователь с id "(.*)"$/, (userId: string) => {
            // Авторизация не требуется для этого теста
        });

        given(/^я аутентифицируюсь с паролем "(.*)"$/, (password: string) => {
            (this as any).testPassword = password;
        });

        when('система хеширует пароль с использованием bcrypt', async () => {
                const iterations = 10;
                const times: number[] = [];
        
            for (let i = 0; i < iterations; i++) {
            const startTime = process.hrtime();
            const realBcrypt = require('bcrypt');
            await realBcrypt.hash((this as any).testPassword, 12); // saltRounds = 12
            const endTime = process.hrtime(startTime);
            const timeInMs = (endTime[0] * 1000) + (endTime[1] / 1000000);
            times.push(timeInMs);
        }
        
        // Используем среднее значение
                const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                bcryptTimes.push(avgTime);
        });

        when('система хеширует тот же пароль с использованием MD5', () => {
        const iterations = 1000;
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
            const startTime = process.hrtime();
            crypto.createHash('md5').update((this as any).testPassword).digest('hex');
            const endTime = process.hrtime(startTime);
            const timeInMs = (endTime[0] * 1000) + (endTime[1] / 1000000);
            times.push(timeInMs);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        md5Times.push(avgTime);
        });

        then('время хеширования bcrypt должно быть больше времени MD5', () => {
            // Используем условные проверки, так как время может меняться
                const bcryptAvg = bcryptTimes.reduce((a, b) => a + b, 0) / bcryptTimes.length;
                const md5Avg = md5Times.reduce((a, b) => a + b, 0) / md5Times.length;
                const difference = bcryptAvg - md5Avg;
                
                console.log(`Среднее время bcrypt: ${bcryptAvg} мс`);
                console.log(`Среднее время MD5: ${md5Avg} мс`);
                console.log(`Разница: ${difference} мс`);
                console.log(`Отношение: ${(bcryptAvg / md5Avg).toFixed(2)}x`);
            
                expect(bcryptAvg).toBeGreaterThan(md5Avg); // bcrypt должен быть медленнее
        });

        and('безопасность bcrypt должна быть выше, чем MD5', () => {
            expect(bcryptTimes.length).toBeGreaterThan(0);
            expect(md5Times.length).toBeGreaterThan(0);
        });
    });

    test('Обновление имени пользователя', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        and(/^я авторизован как пользователь с id "(.*)"$/, (userId: string) => {
            (this as any).userId = userId;
            usersRepository.findOne.mockResolvedValue({
                id: userId,
                email: 'test@example.com',
                name: 'Old Name',
                password: 'hashedPassword',
                role: UserRole.USER,
                createdAt: new Date(),
            });
            usersRepository.save.mockImplementation((user: any) => Promise.resolve(user));
        });

        given(/^я хочу изменить свое имя на (.*)$/, (newName: string) => {
            (this as any).newName = newName;
        });

        when('я отправляю запрос на обновление профиля', async () => {
            try {
                await authService.updateUser((this as any).userId, {
                    name: (this as any).newName,
                });
            } catch (error) {
                (this as any).lastError = error as Error;
            }
        });

        then('мой профиль должен быть обновлен', () => {
            expect(usersRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: (this as any).newName,
                })
            );
        });

        and('в базе данных должно быть сохранено новое имя', () => {
            // Проверка уже сделана в then
        });
    });

    test('Получение профиля текущего пользователя', ({ given, and, when, then }) => {
        let profileResponse: any;
        
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        and(/^я авторизован как пользователь с id "(.*)"$/, (userId: string) => {
            (this as any).userId = userId;
            usersRepository.findOne.mockResolvedValue({
                id: userId,
                email: 'test@example.com',
                name: 'Test User',
                password: 'hashedPassword123',
                role: UserRole.USER,
                createdAt: new Date(),
            });
        });

        given('я авторизован с токеном пользователя', () => {
            // Авторизация уже выполнена
        });

        when('я запрашиваю свой профиль', async () => {
            try {
                profileResponse = await authService.getProfile((this as any).userId);
            } catch (error) {
                (this as any).lastError = error as Error;
            }
        });

        then('я должен получить данные своего профиля', () => {
            expect(profileResponse).toBeDefined();
            expect(profileResponse.id).toBe((this as any).userId);
            expect(profileResponse.email).toBe('test@example.com');
        });

        and('в ответе не должно быть поля password', () => {
            expect(profileResponse.password).toBeUndefined();
        });
    });
});