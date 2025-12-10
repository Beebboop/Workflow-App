/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { FuzzedDataProvider } from '@jazzer.js/core';
import { TaskService } from '../task/task.service';
import '@jazzer.js/jest-runner';
import { TaskStatus } from 'types/src';



// Общие XSS паттерны (RegExp для гибкости)
const xssPatterns = [
  /<script.*?>.*?<\/script>/i,
  /alert\(.*?\)/i,
  /javascript:/i,
  /onerror=/i,
];


// Вспомогательная функция для проверки XSS
const checkXSS = (input: string, source?: string): void => {
  const foundXSS = xssPatterns.filter(pattern => pattern.test(input));
  if (foundXSS.length > 0) {
    const patternStr = foundXSS.map(p => p.source).join(', ');
    const message = source ? `XSS в ${source}: ${patternStr}` : `XSS паттерны обнаружены: ${patternStr}`;
    throw new Error(`${message}, input: ${input.substring(0, 200)}`);
  }
};

describe('TaskService Fuzzing - Get Task Test', () => {
  let taskService: TaskService;
  let mockTasksRepository: any;

  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    reporterId: 'user-123',
    assigneeId: 'user-456',
    boardId: 'board-123'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockTasksRepository = {
      findOne: jest.fn(),
    };

    mockTasksRepository.findOne.mockResolvedValue(mockTask);

    taskService = new TaskService(
      mockTasksRepository as any,
      //Остальные репозитории и сервис не нужны в данном случае
      {} as any,
      {} as any,
      {} as any,
    );
  });
  
  it.fuzz('getTaskById - XSS injection', async (data: Buffer) => {
    const inputString = data.toString('utf8', 0, Math.min(data.length, 500));
    
    console.log(`Input length: ${data.length} bytes`);
    console.log(`Input preview: ${inputString.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}`);
    
    // Проверка на XSS в строке
    checkXSS(inputString, 'inputString');
    
    const provider = new FuzzedDataProvider(data);
    const taskId = provider.consumeString(100);
    
    // Проверка на XSS в taskId
    if (provider.consumeBoolean()) {
      checkXSS(taskId, 'taskId');
    }
    
    try {
      if (taskId === mockTask.id) {
        mockTasksRepository.findOne.mockResolvedValueOnce(mockTask);
      } else {
        return;
      }
      
      const result = await taskService.getTaskById(taskId);
      
      if (result) {
        checkXSS(JSON.stringify(result), 'result');
      }
      
      if (taskId === mockTask.id) {
        expect(result).toEqual(mockTask);
      }
      
      expect(mockTasksRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    } catch (error: any) {
      if (error.message) {
        // Проверка на XSS в сообщении ошибки
        checkXSS(error.message, 'error message');
      }
      throw error;
    }
  });
});