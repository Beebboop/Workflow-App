/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { loadFeature, defineFeature } from 'jest-cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../user.entity';
import { UserRole } from 'types/src';
import { DataGenerator } from '../setup/data-generator';
import { BoundaryFinder } from '../setup/boundary-finder';

const feature = loadFeature('./src/test/bdd/features/user_authentication.feature');

// Интерфейс для строк таблицы анализа масштабирования
interface ScaleAnalysisRow {
    'Категории': string;
    'Коэффициент': string;
}

function formatTable(data: any[], columns: string[]): string {
    const rows = data.map(row => columns.map(col => row[col] || ''));
    const colWidths = columns.map((col, i) => 
        Math.max(
            col.length,
            ...rows.map(row => String(row[i] || '').length)
        )
    );
    
    const separator = colWidths.map(width => '-'.repeat(width + 2)).join('+');
    
    let result = '';
    result += '+' + separator + '+\n';
    result += '| ' + columns.map((col, i) => col.padEnd(colWidths[i])).join(' | ') + ' |\n';
    result += '+' + separator + '+\n';
    
    rows.forEach(row => {
        result += '| ' + row.map((cell, i) => String(cell).padEnd(colWidths[i])).join(' | ') + ' |\n';
    });
    
    result += '+' + separator + '+';
    return result;
}

function printSummaryTable(metrics: Map<string, any>) {
    const tableData = Array.from(metrics.entries()).map(([category, data]) => ({
        Категория: category,
        'Кол-во запросов': data.count,
        'Ср. время (мс)': data.time.toFixed(2),
        'Успешность (%)': data.successRate.toFixed(2),
        'RPS (запросов/сек)': (data.count / (data.time / 1000)).toFixed(2),
    }));
    
    console.log('\nТАБЛИЦА РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ');
    console.log('='.repeat(80));
    
    if (console.table) {
        console.table(tableData);
    } else {
        console.log(formatTable(tableData, ['Категория', 'Кол-во запросов', 'Ср. время (мс)', 'Успешность (%)', 'RPS (запросов/сек)']));
    }
}

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
    let lastResponse: any;
    let lastError: Error;
    let performanceMetrics: Array<{ time: number; success: boolean }> = [];
    // eslint-disable-next-line prefer-const
    let categoryMetrics: Map<string, { time: number; successRate: number; count: number }> = new Map();

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
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
                        signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        usersRepository = module.get(getRepositoryToken(User));
    });

    test('Успешный вход с правильными учетными данными', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
            // Система уже запущена
        });

        given(/^в базе данных есть пользователь:$/, (table: any[]) => {
            const userData = table[0];
            usersRepository.findOne.mockImplementation((options: any) => {
                if (options?.where?.email === userData.email) {
                    return Promise.resolve({
                        id: 'user-123',
                        email: userData.email,
                        password: 'hashedPassword123', //нам неизвестен пароль в БД, потому что он хеширован(симуляция хеша)
                        name: userData.name,
                        role: UserRole.USER,
                        createdAt: new Date(),
                    });
                }
                return Promise.resolve(null);
            });
            mockBcryptCompare.mockResolvedValue(true);
        });

        given(/^я ввожу email "(.*)"$/, (email: string) => {
            (this as any).loginEmail = email;
        });

        given(/^я ввожу пароль "(.*)"$/, (password: string) => {
            (this as any).loginPassword = password;
        });

        when('я отправляю форму входа', async () => {
            try {
                lastResponse = await authService.login({
                    email: (this as any).loginEmail,
                    password: (this as any).loginPassword,
                });
            } catch (error) {
                lastError = error as Error;
            }
        });

        then('я должен получить JWT токен', () => {
            expect(lastResponse.token).toBe('mock-jwt-token');
        });

        and('в ответе должен быть объект пользователя без пароля', () => {
            expect(lastResponse.user).toBeDefined();
            expect(lastResponse.user.password).toBeUndefined();
            expect(lastResponse.user.email).toBe('user@test.com');
        });
    });

    test('Нагрузочное тестирование входа пользователей', ({ given, when, then, and }) => {
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        given(/^в базе данных есть пользователь:$/, (table: any[]) => {
            const userData = table[0];
            usersRepository.findOne.mockImplementation((options: any) => {
                if (options?.where?.email === userData.email) {
                    return Promise.resolve({
                        id: 'user-123',
                        email: userData.email,
                        password: 'hashedPassword123',
                        name: userData.name,
                        role: UserRole.USER,
                        createdAt: new Date(),
                    });
                }
                return Promise.resolve(null);
            });
            mockBcryptCompare.mockResolvedValue(true);
        });

        given(/^в системе зарегистрировано (\d+) пользователей$/, async (usersCount: string) => {
            const count = parseInt(usersCount);
            
            // Определяем категорию теста
            let category = '';
            if (count <= 1000) category = 'SMALL';
            else if (count <= 5000) category = 'MEDIUM';
            else if (count <= 10000) category = 'LARGE';
            else category = 'XLARGE';
            
            console.log(`\n=== КАТЕГОРИЯ ТЕСТА: ${category} (${count} пользователей) ===`);
            
            // Используем DataGenerator для создания тестовых пользователей
            const testUsers = DataGenerator.generateUsers(Math.min(count, 100));
            
            const mockUsers = testUsers.map((user, index) => ({
                id: `user-${index}`,
                email: user.email,
                password: 'hashedPassword',
                name: user.name,
                role: UserRole.USER,
                createdAt: new Date(),
            }));

            usersRepository.findOne.mockImplementation((options: any) => {
                const user = mockUsers.find(u => u.email === options?.where?.email);
                return Promise.resolve(user || null);
            });
            mockBcryptCompare.mockResolvedValue(true);
        });

        when(/^происходит (\d+) одновременных запросов на вход$/, async (requestsCount: string) => {
            const count = parseInt(requestsCount);
            performanceMetrics = [];

            let maxResponseTime = 1000;
            let successRate = 95;

            if (count >= 5000 && count < 10000){
                 maxResponseTime = 1500;
                successRate = 90;
            }
            else if (count >= 10000 && count < 50000){
                maxResponseTime = 2000;
                successRate = 90;
            } 
            else if (count >= 50000) {
                maxResponseTime = 5000;
                successRate = 85;
            }


            // Используем BoundaryFinder для теста
            const boundaries = await BoundaryFinder.findMaxBoundaries(maxResponseTime, successRate, count);
            console.log('Границы системы:', boundaries);
            
            // Генерируем сценарии нагрузочного тестирования
            const scenarios = DataGenerator.generateLoadTestScenarios();
            console.log('Сценарии тестирования:', scenarios);
            
            // Определяем текущий сценарий
            let currentScenario = scenarios.find(s => s.requests === count);
            if (!currentScenario) {
                // Находим ближайший сценарий в случае, если не было сценариев с точным совпадением запросов(берется ближайший)
                currentScenario = scenarios.reduce((prev, curr) => 
                    Math.abs(curr.requests - count) < Math.abs(prev.requests - count) ? curr : prev
                );
            }
            
            console.log(`Выполняется сценарий: ${currentScenario.label} (${count} запросов)`);
            console.log(`Начало тестирования: ${new Date().toISOString()}`);
            
            const requests: Promise<void>[] = [];
            const startOverallTime = Date.now();
            
            for (let i = 0; i < count; i++) {
                const requestStartTime = Date.now();
                
                const requestPromise = authService.login({
                    email: `user${i % 100}@test.com`,
                    password: 'password123',
                })
                    .then(() => {
                        const endTime = Date.now();
                        performanceMetrics.push({
                            time: endTime - requestStartTime,
                            success: true,
                        });
                        return undefined;
                    })
                    .catch(() => {
                        const endTime = Date.now();
                        performanceMetrics.push({
                            time: endTime - requestStartTime,
                            success: false,
                        });
                        return undefined;
                    });
                
                requests.push(requestPromise);
            }
            
            await Promise.all(requests);
            
            const endOverallTime = Date.now();
            const totalTestTime = endOverallTime - startOverallTime;
            console.log(`Общее время выполнения теста: ${totalTestTime} мс`);
        });

        then(/^среднее время ответа должно быть менее (\d+) мс$/, (maxResponseTime: string) => {
                const maxTime = parseInt(maxResponseTime);
                const totalTime = performanceMetrics.reduce((sum, metric) => sum + metric.time, 0);
                const averageTime = totalTime / performanceMetrics.length;
                
                expect(averageTime).toBeLessThan(maxTime);
        });

        and(/^процент успешных ответов должен быть более (\d+)%$/, (successRate: string) => {
            const minRate = parseFloat(successRate);
            const successfulRequests = performanceMetrics.filter(m => m.success).length;
            const actualSuccessRate = (successfulRequests / performanceMetrics.length) * 100;
            console.log(`Процент успешных ответов: ${actualSuccessRate.toFixed(2)}%`);
            console.log(`Успешных запросов: ${successfulRequests} из ${performanceMetrics.length}`);
            
            // Сохраняем метрики для категории
            const totalTime = performanceMetrics.reduce((sum, metric) => sum + metric.time, 0);
            const averageTime = totalTime / performanceMetrics.length;
            
            // Определяем категорию по количеству запросов
            let category = '';
            const count = performanceMetrics.length;
            if (count <= 1000) category = 'SMALL';
            else if (count <= 5000) category = 'MEDIUM';
            else if (count <= 10000) category = 'LARGE';
            else category = 'XLARGE';
            
            categoryMetrics.set(category, {
                time: averageTime,
                successRate: actualSuccessRate,
                count: performanceMetrics.length
            });
            
            // Выводим сводку по всем категориям
            if (categoryMetrics.size > 0) {
                printSummaryTable(categoryMetrics);
                
                // Анализ производительности по категориям
                console.log('\nАНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ ПО КАТЕГОРИЯМ');
                console.log('='.repeat(80));
                
                const smallMetrics = categoryMetrics.get('SMALL');
                const mediumMetrics = categoryMetrics.get('MEDIUM');
                const largeMetrics = categoryMetrics.get('LARGE');
                const xlargeMetrics = categoryMetrics.get('XLARGE');
                

                const scaleAnalysis: ScaleAnalysisRow[] = [];
                
                if (smallMetrics && mediumMetrics) {
                        const scaleFactor = mediumMetrics.time / smallMetrics.time;
                        scaleAnalysis.push({ 'Категории': 'SMALL => MEDIUM', 'Коэффициент': `${scaleFactor.toFixed(2)}x` });
                }
                
                if (mediumMetrics && largeMetrics) {
                        const scaleFactor = largeMetrics.time / mediumMetrics.time;
                        scaleAnalysis.push({ 'Категории': 'MEDIUM => LARGE', 'Коэффициент': `${scaleFactor.toFixed(2)}x` });
                }
                
                if (largeMetrics && xlargeMetrics) {
                        const scaleFactor = xlargeMetrics.time / largeMetrics.time;
                        scaleAnalysis.push({ 'Категории': 'LARGE => XLARGE', 'Коэффициент': `${scaleFactor.toFixed(2)}x` });
                }
                
                if (console.table && scaleAnalysis.length > 0) {
                        console.table(scaleAnalysis);
                } else if (scaleAnalysis.length > 0) {
                        console.log(formatTable(scaleAnalysis, ['Категории', 'Коэффициент']));
                }
        }
            
            expect(actualSuccessRate).toBeGreaterThan(minRate);
        });
    });

    test('Неуспешный вход с неправильным паролем', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        and('в базе данных есть пользователь:', (table: any[]) => {
            const userData = table[0];
            usersRepository.findOne.mockResolvedValue({
                id: 'user-123',
                email: userData.email,
                password: 'hashedPassword',
                name: userData.name,
                role: UserRole.USER,
                createdAt: new Date(),
            });
        });

        given(/^я ввожу email "(.*)"$/, (email: string) => {
            (this as any).loginEmail = email;
        });

        and(/^я ввожу пароль "(.*)"$/, (password: string) => {
            (this as any).loginPassword = password;
            mockBcryptCompare.mockResolvedValue(false);
        });

        when('я отправляю форму входа', async () => {
            try {
                lastResponse = await authService.login({
                    email: (this as any).loginEmail,
                    password: (this as any).loginPassword,
                });
            } catch (error) {
                lastError = error as Error;
            }
        });

        then('я должен получить ошибку аутентификации', () => {
            expect(lastError).toBeInstanceOf(UnauthorizedException);
        });

        and(/^система должна вернуть сообщение "(.*)"$/, (message: string) => {
            expect((lastError as any).message).toBe(message);
        });
    });

    test('Попытка входа несуществующего пользователя', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
            // Система запущена
        });

        and('в базе данных есть пользователь:', (table: any[]) => {
            // Устанавливаем, что пользователь существует только для user@test.com
            usersRepository.findOne.mockImplementation((options: any) => {
                if (options?.where?.email === 'user@test.com') {
                    return Promise.resolve({
                        id: 'user-123',
                        email: 'user@test.com',
                        password: 'hashedPassword',
                        name: 'Test User',
                        role: UserRole.USER,
                        createdAt: new Date(),
                    });
                }
                return Promise.resolve(null);
            });
        });

        given(/^я ввожу email "(.*)"$/, (email: string) => {
            (this as any).loginEmail = email;
        });

        and(/^я ввожу пароль "(.*)"$/, (password: string) => {
            (this as any).loginPassword = password;
        });

        when('я отправляю форму входа', async () => {
            try {
                lastResponse = await authService.login({
                    email: (this as any).loginEmail,
                    password: (this as any).loginPassword,
                });
            } catch (error) {
                lastError = error as Error;
            }
        });

        then('я должен получить ошибку аутентификации', () => {
            expect(lastError).toBeInstanceOf(UnauthorizedException);
        });

        and(/^система должна вернуть сообщение "(.*)"$/, (message: string) => {
            expect((lastError as any).message).toBe(message);
        });
    });
});