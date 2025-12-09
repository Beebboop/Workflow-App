"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const auth_service_1 = require("../../../auth/auth.service");
const user_entity_1 = require("../../../user.entity");
jest.mock('bcrypt');
describe('AuthService - Equivalence Analysis', () => {
    let authService;
    let usersRepository;
    let jwtService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        remove: jest.fn(),
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
        bcrypt.hash.mockResolvedValue('hashedPassword');
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
                const registerDto = {
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
                }
                else {
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
                expectedError: common_1.ConflictException,
            },
        ];
        testCases.forEach(({ description, setup, shouldPass, expectedError }) => {
            it(`должен ${shouldPass ? 'допустить' : 'предотвратить'} регистрацию по причине ${description}`, async () => {
                setup();
                const registerDto = {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                };
                bcrypt.hash.mockResolvedValue('hashedPassword');
                if (shouldPass) {
                    const result = await authService.register(registerDto);
                    expect(result).toBeDefined();
                    expect(result.token).toBe('mock-jwt-token');
                }
                else {
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
                expectedError: common_1.UnauthorizedException,
            },
            {
                description: 'Неправильный пароль',
                setup: () => {
                    usersRepository.findOne.mockResolvedValue(mockUser);
                    bcrypt.compare.mockResolvedValue(false);
                },
                shouldPass: false,
                expectedError: common_1.UnauthorizedException,
            },
            {
                description: 'Правильные учетные данные',
                setup: () => {
                    usersRepository.findOne.mockResolvedValue(mockUser);
                    bcrypt.compare.mockResolvedValue(true);
                },
                shouldPass: true,
            },
        ];
        testCases.forEach(({ description, setup, shouldPass, expectedError }) => {
            it(`должен ${shouldPass ? 'допустить' : 'предотвратить'} логин по причине ${description}`, async () => {
                setup();
                const loginDto = {
                    email: 'test@example.com',
                    password: 'password123',
                };
                if (shouldPass) {
                    const result = await authService.login(loginDto);
                    expect(result).toBeDefined();
                    expect(result.token).toBe('mock-jwt-token');
                }
                else {
                    await expect(authService.login(loginDto))
                        .rejects.toThrow(expectedError);
                }
            });
        });
    });
    describe('Тесты после выявленных первой мутацией уязвимостей  ', () => {
        it('должен отклонить email, который не начинается с начала строки (убивает мутацию regex без ^)', async () => {
            const registerDto = {
                name: 'Test',
                email: ' test@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Invalid email format');
        });
        it('должен отклонить email, который продолжается после точки (убивает мутацию без $)', async () => {
            const registerDto = {
                name: 'Test',
                email: 'test@example.com invalid',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Invalid email format');
        });
        it('должен выбросить исключение с точным сообщением при невалидном email', async () => {
            const registerDto = {
                name: 'Test',
                email: 'invalid-email',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Invalid email format');
        });
        it('должен предотвратить регистрацию, если findOne вернёт пользователя по неправильному запросу (мокаем findOne с where: {})', async () => {
            usersRepository.findOne.mockResolvedValue({ id: 'wrong-user' });
            const registerDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('User with this email already exists');
        });
        it('должен выбросить точное сообщение при существующем пользователе', async () => {
            usersRepository.findOne.mockResolvedValue({ id: 'existing' });
            const registerDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('User with this email already exists');
        });
        it('должен предотвратить регистрацию, если where в findOne пуст', async () => {
            usersRepository.findOne.mockResolvedValue({ id: 'random-user' });
            const registerDto = {
                name: 'Test',
                email: 'new@example.com',
                password: 'validPass',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
        });
        it('должен провалить create с пустым объектом', async () => {
            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue({});
            usersRepository.save.mockResolvedValue({ id: 'user-123' });
            const registerDto = {
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
            const loginDto = {
                email: 'wrong@example.com',
                password: 'password123',
            };
            await expect(authService.login(loginDto))
                .rejects.toThrow(common_1.UnauthorizedException);
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
            bcrypt.compare.mockResolvedValue(false);
            const loginDto = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };
            await expect(authService.login(loginDto))
                .rejects.toThrow(common_1.UnauthorizedException);
            await expect(authService.login(loginDto))
                .rejects.toThrow('Invalid email or password');
        });
        it('должен искать пользователя по email при регистрации', async () => {
            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue({});
            usersRepository.save.mockResolvedValue({ id: 'user-123' });
            const registerDto = {
                name: 'Test User',
                email: 'unique@example.com',
                password: 'password123',
            };
            await authService.register(registerDto);
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
            bcrypt.compare.mockResolvedValue(true);
            const loginDto = {
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
//# sourceMappingURL=auth.service.equivalence.spec.js.map