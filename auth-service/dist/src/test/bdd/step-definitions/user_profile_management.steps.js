"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_cucumber_1 = require("jest-cucumber");
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const crypto = require("crypto");
const auth_service_1 = require("../../../auth/auth.service");
const user_entity_1 = require("../../../user.entity");
const src_1 = require("types/src");
const feature = (0, jest_cucumber_1.loadFeature)('./src/test/bdd/features/user_profile_management.feature');
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();
jest.mock('bcrypt', () => ({
    compare: (...args) => mockBcryptCompare(...args),
    hash: (...args) => mockBcryptHash(...args),
}));
(0, jest_cucumber_1.defineFeature)(feature, (test) => {
    let authService;
    let usersRepository;
    let bcryptTimes = [];
    let md5Times = [];
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
                        save: jest.fn(),
                    },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
                    },
                },
            ],
        }).compile();
        authService = module.get(auth_service_1.AuthService);
        usersRepository = module.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    });
    test('Сравнение алгоритмов хеширования паролей', ({ given, when, then, and }) => {
        given('система аутентификации запущена', () => {
        });
        and(/^я авторизован как пользователь с id "(.*)"$/, (userId) => {
        });
        given(/^я аутентифицируюсь с паролем "(.*)"$/, (password) => {
            this.testPassword = password;
        });
        when('система хеширует пароль с использованием bcrypt', async () => {
            const iterations = 10;
            const times = [];
            for (let i = 0; i < iterations; i++) {
                const startTime = process.hrtime();
                const realBcrypt = require('bcrypt');
                await realBcrypt.hash(this.testPassword, 12);
                const endTime = process.hrtime(startTime);
                const timeInMs = (endTime[0] * 1000) + (endTime[1] / 1000000);
                times.push(timeInMs);
            }
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            bcryptTimes.push(avgTime);
        });
        when('система хеширует тот же пароль с использованием MD5', () => {
            const iterations = 1000;
            const times = [];
            for (let i = 0; i < iterations; i++) {
                const startTime = process.hrtime();
                crypto.createHash('md5').update(this.testPassword).digest('hex');
                const endTime = process.hrtime(startTime);
                const timeInMs = (endTime[0] * 1000) + (endTime[1] / 1000000);
                times.push(timeInMs);
            }
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            md5Times.push(avgTime);
        });
        then('время хеширования bcrypt должно быть больше времени MD5', () => {
            const bcryptAvg = bcryptTimes.reduce((a, b) => a + b, 0) / bcryptTimes.length;
            const md5Avg = md5Times.reduce((a, b) => a + b, 0) / md5Times.length;
            const difference = bcryptAvg - md5Avg;
            console.log(`Среднее время bcrypt: ${bcryptAvg} мс`);
            console.log(`Среднее время MD5: ${md5Avg} мс`);
            console.log(`Разница: ${difference} мс`);
            console.log(`Отношение: ${(bcryptAvg / md5Avg).toFixed(2)}x`);
            expect(bcryptAvg).toBeGreaterThan(md5Avg);
        });
        and('безопасность bcrypt должна быть выше, чем MD5', () => {
            expect(bcryptTimes.length).toBeGreaterThan(0);
            expect(md5Times.length).toBeGreaterThan(0);
        });
    });
    test('Обновление имени пользователя', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
        });
        and(/^я авторизован как пользователь с id "(.*)"$/, (userId) => {
            this.userId = userId;
            usersRepository.findOne.mockResolvedValue({
                id: userId,
                email: 'test@example.com',
                name: 'Old Name',
                password: 'hashedPassword',
                role: src_1.UserRole.USER,
                createdAt: new Date(),
            });
            usersRepository.save.mockImplementation((user) => Promise.resolve(user));
        });
        given(/^я хочу изменить свое имя на (.*)$/, (newName) => {
            this.newName = newName;
        });
        when('я отправляю запрос на обновление профиля', async () => {
            try {
                await authService.updateUser(this.userId, {
                    name: this.newName,
                });
            }
            catch (error) {
                this.lastError = error;
            }
        });
        then('мой профиль должен быть обновлен', () => {
            expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                name: this.newName,
            }));
        });
        and('в базе данных должно быть сохранено новое имя', () => {
        });
    });
    test('Получение профиля текущего пользователя', ({ given, and, when, then }) => {
        let profileResponse;
        given('система аутентификации запущена', () => {
        });
        and(/^я авторизован как пользователь с id "(.*)"$/, (userId) => {
            this.userId = userId;
            usersRepository.findOne.mockResolvedValue({
                id: userId,
                email: 'test@example.com',
                name: 'Test User',
                password: 'hashedPassword123',
                role: src_1.UserRole.USER,
                createdAt: new Date(),
            });
        });
        given('я авторизован с токеном пользователя', () => {
        });
        when('я запрашиваю свой профиль', async () => {
            try {
                profileResponse = await authService.getProfile(this.userId);
            }
            catch (error) {
                this.lastError = error;
            }
        });
        then('я должен получить данные своего профиля', () => {
            expect(profileResponse).toBeDefined();
            expect(profileResponse.id).toBe(this.userId);
            expect(profileResponse.email).toBe('test@example.com');
        });
        and('в ответе не должно быть поля password', () => {
            expect(profileResponse.password).toBeUndefined();
        });
    });
});
//# sourceMappingURL=user_profile_management.steps.js.map