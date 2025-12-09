"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@jazzer.js/core");
const auth_service_1 = require("../auth/auth.service");
const user_1 = require("../../types/src/user");
const bcrypt = require("bcrypt");
require("@jazzer.js/jest-runner");
const vulnerableFileRead = (filename) => {
    const fs = require('fs');
    try {
        return fs.readFileSync(filename, 'utf8');
    }
    catch {
        return 'file not found';
    }
};
const vulnerableSQLQuery = (username) => {
    return `SELECT * FROM user WHERE name = '${username}'`;
};
const vulnerableCommandExecution = (input) => {
    const { execSync } = require('child_process');
    try {
        const result = execSync(`echo ${input}`).toString();
        return result;
    }
    catch {
        return 'error';
    }
};
describe('AuthService Fuzzing - Register Test', () => {
    let authService;
    let mockUserRepository;
    let mockJwtService;
    beforeEach(() => {
        jest.clearAllMocks();
        mockUserRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };
        mockJwtService = {
            sign: jest.fn(),
        };
        jest.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2b$12$hashedpassword');
        authService = new auth_service_1.AuthService(mockUserRepository, mockJwtService);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it.fuzz('register - path traversal and command injection', async (data) => {
        const provider = new core_1.FuzzedDataProvider(data);
        const email = provider.consumeString(50);
        const password = provider.consumeString(50);
        const name = provider.consumeString(50);
        if (provider.consumeBoolean()) {
            if (email.includes('../') || email.includes('..\\')) {
                vulnerableFileRead(email);
            }
        }
        if (provider.consumeBoolean()) {
            vulnerableCommandExecution(email);
        }
        if (provider.consumeBoolean()) {
            console.log('Generated SQL:', vulnerableSQLQuery(email));
        }
        mockUserRepository.findOne.mockResolvedValue(null);
        mockUserRepository.create.mockImplementation((user) => ({
            ...user,
            id: 'test-id',
            createdAt: new Date(),
            role: user_1.UserRole.USER,
        }));
        mockUserRepository.save.mockResolvedValue({
            id: 'test-id',
            email,
            name,
            password: '$2b$12$hashedpassword',
            role: user_1.UserRole.USER,
            createdAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('test-token');
        try {
            const result = await authService.register({ email, password, name });
            expect(result).toBeDefined();
        }
        catch (error) {
            const allowed = [
                'ConflictException',
                'Invalid email format',
                'Password must be at least 4',
                'Name must be at least 4'
            ];
            const isAllowed = allowed.some(err => error.message?.includes(err) ||
                error.name?.includes(err));
            if (!isAllowed) {
                throw error;
            }
        }
    });
});
//# sourceMappingURL=auth.fuzz.js.map