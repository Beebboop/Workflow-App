/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */

import { FuzzedDataProvider } from '@jazzer.js/core';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../../types/src/user';
import * as bcrypt from 'bcrypt';
import '@jazzer.js/jest-runner';


// Вспомогательные функции уязвимости

//Уязвимость прочтения файла через запросы
const vulnerableFileRead = (filename: string): string => {
  const fs = require('fs');
  try {
    return fs.readFileSync(filename, 'utf8');
  } catch {
    return 'file not found';
  }
};


// Создаем describe блоки для каждого теста
describe('AuthService Fuzzing - Register Test', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;
  
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
    
    authService = new AuthService(
      mockUserRepository as any,
      mockJwtService as any,
    );
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it.fuzz('register - path traversal injection', async (data: Buffer) => {
    const provider = new FuzzedDataProvider(data);

    const email = provider.consumeString(50);
    const password = provider.consumeString(50);
    const name = provider.consumeString(50);
    
    if (provider.consumeBoolean()) {
      // Path Traversal(обход пути через запрос)
      if (email.includes('../') || email.includes('..\\')) {
        vulnerableFileRead(email);
      }
    }
    
    
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockImplementation((user: any) => ({
      ...user,
      id: 'test-id',
      createdAt: new Date(),
      role: UserRole.USER,
    }));
    
    mockUserRepository.save.mockResolvedValue({
      id: 'test-id',
      email,
      name,
      password: '$2b$12$hashedpassword',
      role: UserRole.USER,
      createdAt: new Date(),
    });
    
    mockJwtService.sign.mockReturnValue('test-token');
    
    try {
      const result = await authService.register({ email, password, name });
      expect(result).toBeDefined();
    } catch (error: any) {
      // Разрешаем только ожидаемые ошибки
      const allowed = [
        'ConflictException',
        'Invalid email format',
        'Password must be at least 4',
        'Name must be at least 4'
      ];
      
      const isAllowed = allowed.some(err => 
        error.message?.includes(err) || 
        error.name?.includes(err)
      );
      
      if (!isAllowed) {
        throw error;
      }
    }
  });
});

