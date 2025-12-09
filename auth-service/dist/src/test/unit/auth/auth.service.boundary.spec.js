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
describe('AuthService - Boundary Value Analysis', () => {
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
                const registerDto = {
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
                }
                else {
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
                const registerDto = {
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
                }
                else {
                    await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
                }
            });
        });
    });
    describe('Тесты после выявленных первой мутацией уязвимостей  ', () => {
        it('должен выбросить исключение с точным сообщением для пароля меньше 4 символов', async () => {
            const registerDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'abc',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Password must be at least 4 and 20 maximum characters long');
        });
        it('должен выбросить исключение с точным сообщением для пароля больше 20 символов', async () => {
            const registerDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'a'.repeat(21),
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Password must be at least 4 and 20 maximum characters long');
        });
        it('должен выбросить исключение с точным сообщением для имени короче 4 символов', async () => {
            const registerDto = {
                name: 'Abc',
                email: 'test@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
            await expect(authService.register(registerDto)).rejects.toThrow('Name must be at least 4 and 20 maximum characters long');
        });
        it('должен корректно обрабатывать границу, где длина = 4 (минимум, чтобы убить изменения в ||)', async () => {
            const registerDto = {
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
            const registerDto = {
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
            const registerDto = {
                name: 'Test',
                email: 'unique@example.com',
                password: 'validPass123',
            };
            await expect(authService.register(registerDto)).rejects.toThrow(common_1.ConflictException);
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
//# sourceMappingURL=auth.service.boundary.spec.js.map