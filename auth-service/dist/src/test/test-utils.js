"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUtils = void 0;
const testing_1 = require("@nestjs/testing");
const jwt_1 = require("@nestjs/jwt");
class TestUtils {
    static createMockUser(overrides) {
        return {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            password: 'hashedPassword',
            role: 'user',
            createdAt: new Date(),
            ...overrides,
        };
    }
    static createMockRepository() {
        return {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
    }
    static async createTestingModule(providers) {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                ...providers,
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
                        verify: jest.fn(),
                    },
                },
            ],
        }).compile();
        return module;
    }
}
exports.TestUtils = TestUtils;
//# sourceMappingURL=test-utils.js.map