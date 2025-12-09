import { TestingModule } from '@nestjs/testing';
import { User } from '../user.entity';
export declare class TestUtils {
    static createMockUser(overrides?: Partial<User>): User;
    static createMockRepository(): {
        findOne: jest.Mock<any, any, any>;
        find: jest.Mock<any, any, any>;
        create: jest.Mock<any, any, any>;
        save: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
    };
    static createTestingModule(providers: any[]): Promise<TestingModule>;
}
