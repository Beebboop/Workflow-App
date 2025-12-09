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
const feature = (0, jest_cucumber_1.loadFeature)('./src/test/bdd/features/user_registration.feature');
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();
jest.mock('bcrypt', () => ({
    compare: (...args) => mockBcryptCompare(...args),
    hash: (...args) => mockBcryptHash(...args),
}));
(0, jest_cucumber_1.defineFeature)(feature, (test) => {
    let authService;
    let usersRepository;
    let jwtService;
    let lastResponse;
    let lastError;
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
                        create: jest.fn(),
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
        jwtService = module.get(jwt_1.JwtService);
        mockBcryptHash.mockResolvedValue('hashedPassword123');
        usersRepository.create.mockImplementation((data) => ({
            ...data,
            id: 'new-user-id',
            role: src_1.UserRole.USER,
            createdAt: new Date(),
        }));
        usersRepository.save.mockImplementation((user) => Promise.resolve(user));
    });
    test('Успешная регистрация нового пользователя', ({ given, when, then, and }) => {
        given('система аутентификации запущена', () => {
        });
        given('база данных пользователей пуста', () => {
            usersRepository.findOne.mockResolvedValue(null);
        });
        given(/^я заполняю форму регистрации с данными:$/, (table) => {
            const data = table.reduce((acc, row) => {
                const key = row.Поле.toLowerCase();
                acc[key] = row.Значение;
                return acc;
            }, {});
            this.registrationData = data;
        });
        when('я отправляю форму регистрации', async () => {
            try {
                lastResponse = await authService.register({
                    name: this.registrationData.имя,
                    email: this.registrationData.email,
                    password: this.registrationData.пароль,
                });
            }
            catch (error) {
                lastError = error;
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
            expect(lastResponse.user.name).toBe(this.registrationData.имя);
            expect(lastResponse.user.email).toBe(this.registrationData.email);
        });
    });
    test('Попытка регистрации с уже существующим email', ({ given, when, then, and }) => {
        given('система аутентификации запущена', () => {
        });
        and('база данных пользователей пуста', () => {
        });
        given(/^пользователь с email "(.*)" уже зарегистрирован$/, (email) => {
            usersRepository.findOne.mockResolvedValue({
                id: 'existing-user',
                email: email,
                name: 'Existing User',
                password: 'hashedPassword',
                role: src_1.UserRole.USER,
                createdAt: new Date(),
            });
        });
        when(/^я пытаюсь зарегистрироваться с email "(.*)"$/, async (email) => {
            try {
                lastResponse = await authService.register({
                    name: 'Test User',
                    email: email,
                    password: 'password123',
                });
            }
            catch (error) {
                lastError = error;
            }
        });
        then('я должен получить ошибку конфликта', () => {
            expect(lastError).toBeInstanceOf(common_1.ConflictException);
        });
        and(/^система должна вернуть сообщение "(.*)"$/, (message) => {
            expect(lastError.message).toBe(message);
        });
    });
    test('Регистрация с паролем недопустимой длины', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
        });
        and('база данных пользователей пуста', () => {
            usersRepository.findOne.mockResolvedValue(null);
        });
        given(/^я ввожу пароль длиной (.*) символов$/, (length) => {
            const passwordLength = parseInt(length);
            this.testPassword = 'a'.repeat(passwordLength);
        });
        when('я пытаюсь зарегистрироваться', async () => {
            try {
                lastResponse = await authService.register({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: this.testPassword,
                });
            }
            catch (error) {
                lastError = error;
            }
        });
        then('я должен получить ошибку валидации пароля', () => {
            const passwordLength = this.testPassword.length;
            if (passwordLength < 4 || passwordLength > 20) {
                expect(lastError).toBeInstanceOf(common_1.ConflictException);
                expect(lastError.message).toContain('Password must be');
            }
            else {
                expect(lastResponse).toBeDefined();
            }
        });
    });
    test('Регистрация с некорректным email', ({ given, and, when, then }) => {
        given('система аутентификации запущена', () => {
        });
        and('база данных пользователей пуста', () => {
            usersRepository.findOne.mockResolvedValue(null);
        });
        given(/^я ввожу некорректный email "(.*)"$/, (email) => {
            this.testEmail = email;
        });
        when('я пытаюсь зарегистрироваться', async () => {
            try {
                lastResponse = await authService.register({
                    name: 'Test User',
                    email: this.testEmail,
                    password: 'ValidPass123',
                });
            }
            catch (error) {
                lastError = error;
            }
        });
        then('я должен получить ошибку валидации', () => {
            expect(lastError).toBeInstanceOf(common_1.ConflictException);
        });
        and(/^система должна вернуть сообщение "(.*)"$/, (message) => {
            expect(lastError.message).toBe(message);
        });
    });
});
//# sourceMappingURL=user_registration.steps.js.map