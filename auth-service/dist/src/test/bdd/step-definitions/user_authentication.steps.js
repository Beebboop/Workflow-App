"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_cucumber_1 = require("jest-cucumber");
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../../../auth/auth.service");
const user_entity_1 = require("../../../user.entity");
const src_1 = require("types/src");
const data_generator_1 = require("../setup/data-generator");
const boundary_finder_1 = require("../setup/boundary-finder");
const feature = (0, jest_cucumber_1.loadFeature)('./src/test/bdd/features/user_authentication.feature');
function formatTable(data, columns) {
    const rows = data.map(row => columns.map(col => row[col] || ''));
    const colWidths = columns.map((col, i) => Math.max(col.length, ...rows.map(row => String(row[i] || '').length)));
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
function printSummaryTable(metrics) {
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
    }
    else {
        console.log(formatTable(tableData, ['Категория', 'Кол-во запросов', 'Ср. время (мс)', 'Успешность (%)', 'RPS (запросов/сек)']));
    }
}
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();
jest.mock('bcrypt', () => ({
    compare: (...args) => mockBcryptCompare(...args),
    hash: (...args) => mockBcryptHash(...args),
}));
(0, jest_cucumber_1.defineFeature)(feature, (test) => {
    let authService;
    let usersRepository;
    let lastResponse;
    let lastError;
    let performanceMetrics = [];
    let categoryMetrics = new Map();
    beforeEach(async () => {
        mockBcryptCompare.mockReset();
        mockBcryptHash.mockReset();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
                        signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
                    },
                },
            ],
        }).compile();
        authService = module.get(auth_service_1.AuthService);
        usersRepository = module.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    });
    test('Успешный вход с правильными учетными данными', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
        });
        given(/^в базе данных есть пользователь:$/, (table) => {
            const userData = table[0];
            usersRepository.findOne.mockImplementation((options) => {
                if (options?.where?.email === userData.email) {
                    return Promise.resolve({
                        id: 'user-123',
                        email: userData.email,
                        password: 'hashedPassword123',
                        name: userData.name,
                        role: src_1.UserRole.USER,
                        createdAt: new Date(),
                    });
                }
                return Promise.resolve(null);
            });
            mockBcryptCompare.mockResolvedValue(true);
        });
        given(/^я ввожу email "(.*)"$/, (email) => {
            this.loginEmail = email;
        });
        given(/^я ввожу пароль "(.*)"$/, (password) => {
            this.loginPassword = password;
        });
        when('я отправляю форму входа', async () => {
            try {
                lastResponse = await authService.login({
                    email: this.loginEmail,
                    password: this.loginPassword,
                });
            }
            catch (error) {
                lastError = error;
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
        });
        given(/^в базе данных есть пользователь:$/, (table) => {
            const userData = table[0];
            usersRepository.findOne.mockImplementation((options) => {
                if (options?.where?.email === userData.email) {
                    return Promise.resolve({
                        id: 'user-123',
                        email: userData.email,
                        password: 'hashedPassword123',
                        name: userData.name,
                        role: src_1.UserRole.USER,
                        createdAt: new Date(),
                    });
                }
                return Promise.resolve(null);
            });
            mockBcryptCompare.mockResolvedValue(true);
        });
        given(/^в системе зарегистрировано (\d+) пользователей$/, async (usersCount) => {
            const count = parseInt(usersCount);
            let category = '';
            if (count <= 1000)
                category = 'SMALL';
            else if (count <= 5000)
                category = 'MEDIUM';
            else if (count <= 10000)
                category = 'LARGE';
            else
                category = 'XLARGE';
            console.log(`\n=== КАТЕГОРИЯ ТЕСТА: ${category} (${count} пользователей) ===`);
            const testUsers = data_generator_1.DataGenerator.generateUsers(Math.min(count, 100));
            const mockUsers = testUsers.map((user, index) => ({
                id: `user-${index}`,
                email: user.email,
                password: 'hashedPassword',
                name: user.name,
                role: src_1.UserRole.USER,
                createdAt: new Date(),
            }));
            usersRepository.findOne.mockImplementation((options) => {
                const user = mockUsers.find(u => u.email === options?.where?.email);
                return Promise.resolve(user || null);
            });
            mockBcryptCompare.mockResolvedValue(true);
        });
        when(/^происходит (\d+) одновременных запросов на вход$/, async (requestsCount) => {
            const count = parseInt(requestsCount);
            performanceMetrics = [];
            let maxResponseTime = 1000;
            let successRate = 95;
            if (count >= 5000 && count < 10000) {
                maxResponseTime = 1500;
                successRate = 90;
            }
            else if (count >= 10000 && count < 50000) {
                maxResponseTime = 2000;
                successRate = 90;
            }
            else if (count >= 50000) {
                maxResponseTime = 5000;
                successRate = 85;
            }
            const boundaries = await boundary_finder_1.BoundaryFinder.findMaxBoundaries(maxResponseTime, successRate, count);
            console.log('Границы системы:', boundaries);
            const scenarios = data_generator_1.DataGenerator.generateLoadTestScenarios();
            console.log('Сценарии тестирования:', scenarios);
            let currentScenario = scenarios.find(s => s.requests === count);
            if (!currentScenario) {
                currentScenario = scenarios.reduce((prev, curr) => Math.abs(curr.requests - count) < Math.abs(prev.requests - count) ? curr : prev);
            }
            console.log(`Выполняется сценарий: ${currentScenario.label} (${count} запросов)`);
            console.log(`Начало тестирования: ${new Date().toISOString()}`);
            const requests = [];
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
        then(/^среднее время ответа должно быть менее (\d+) мс$/, (maxResponseTime) => {
            const maxTime = parseInt(maxResponseTime);
            const totalTime = performanceMetrics.reduce((sum, metric) => sum + metric.time, 0);
            const averageTime = totalTime / performanceMetrics.length;
            expect(averageTime).toBeLessThan(maxTime);
        });
        and(/^процент успешных ответов должен быть более (\d+)%$/, (successRate) => {
            const minRate = parseFloat(successRate);
            const successfulRequests = performanceMetrics.filter(m => m.success).length;
            const actualSuccessRate = (successfulRequests / performanceMetrics.length) * 100;
            console.log(`Процент успешных ответов: ${actualSuccessRate.toFixed(2)}%`);
            console.log(`Успешных запросов: ${successfulRequests} из ${performanceMetrics.length}`);
            const totalTime = performanceMetrics.reduce((sum, metric) => sum + metric.time, 0);
            const averageTime = totalTime / performanceMetrics.length;
            let category = '';
            const count = performanceMetrics.length;
            if (count <= 1000)
                category = 'SMALL';
            else if (count <= 5000)
                category = 'MEDIUM';
            else if (count <= 10000)
                category = 'LARGE';
            else
                category = 'XLARGE';
            categoryMetrics.set(category, {
                time: averageTime,
                successRate: actualSuccessRate,
                count: performanceMetrics.length
            });
            if (categoryMetrics.size > 0) {
                printSummaryTable(categoryMetrics);
                console.log('\nАНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ ПО КАТЕГОРИЯМ');
                console.log('='.repeat(80));
                const smallMetrics = categoryMetrics.get('SMALL');
                const mediumMetrics = categoryMetrics.get('MEDIUM');
                const largeMetrics = categoryMetrics.get('LARGE');
                const xlargeMetrics = categoryMetrics.get('XLARGE');
                const scaleAnalysis = [];
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
                }
                else if (scaleAnalysis.length > 0) {
                    console.log(formatTable(scaleAnalysis, ['Категории', 'Коэффициент']));
                }
            }
            expect(actualSuccessRate).toBeGreaterThan(minRate);
        });
    });
    test('Неуспешный вход с неправильным паролем', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
        });
        and('в базе данных есть пользователь:', (table) => {
            const userData = table[0];
            usersRepository.findOne.mockResolvedValue({
                id: 'user-123',
                email: userData.email,
                password: 'hashedPassword',
                name: userData.name,
                role: src_1.UserRole.USER,
                createdAt: new Date(),
            });
        });
        given(/^я ввожу email "(.*)"$/, (email) => {
            this.loginEmail = email;
        });
        and(/^я ввожу пароль "(.*)"$/, (password) => {
            this.loginPassword = password;
            mockBcryptCompare.mockResolvedValue(false);
        });
        when('я отправляю форму входа', async () => {
            try {
                lastResponse = await authService.login({
                    email: this.loginEmail,
                    password: this.loginPassword,
                });
            }
            catch (error) {
                lastError = error;
            }
        });
        then('я должен получить ошибку аутентификации', () => {
            expect(lastError).toBeInstanceOf(common_1.UnauthorizedException);
        });
        and(/^система должна вернуть сообщение "(.*)"$/, (message) => {
            expect(lastError.message).toBe(message);
        });
    });
    test('Попытка входа несуществующего пользователя', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
        });
        and('в базе данных есть пользователь:', (table) => {
            usersRepository.findOne.mockImplementation((options) => {
                if (options?.where?.email === 'user@test.com') {
                    return Promise.resolve({
                        id: 'user-123',
                        email: 'user@test.com',
                        password: 'hashedPassword',
                        name: 'Test User',
                        role: src_1.UserRole.USER,
                        createdAt: new Date(),
                    });
                }
                return Promise.resolve(null);
            });
        });
        given(/^я ввожу email "(.*)"$/, (email) => {
            this.loginEmail = email;
        });
        and(/^я ввожу пароль "(.*)"$/, (password) => {
            this.loginPassword = password;
        });
        when('я отправляю форму входа', async () => {
            try {
                lastResponse = await authService.login({
                    email: this.loginEmail,
                    password: this.loginPassword,
                });
            }
            catch (error) {
                lastError = error;
            }
        });
        then('я должен получить ошибку аутентификации', () => {
            expect(lastError).toBeInstanceOf(common_1.UnauthorizedException);
        });
        and(/^система должна вернуть сообщение "(.*)"$/, (message) => {
            expect(lastError.message).toBe(message);
        });
    });
});
//# sourceMappingURL=user_authentication.steps.js.map