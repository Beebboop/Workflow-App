/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { TaskService } from '../../../task/task.service';
import { Task } from '../../../entities/task.entity';
import { Board } from '../../../entities/board.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Sprint } from '../../../entities/sprint.entity';
import { CreateTaskDto, TaskPriority, TaskStatus } from 'types/src';

describe('TaskService - Decision Testing', () => {
  let taskService: TaskService;
  let tasksRepository: Repository<Task>;
  let boardsRepository: Repository<Board>;
  let httpService: HttpService;

  const mockBoard = {
    id: 'board-123',
    name: 'Test Board',
    tasks: []
  };

  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    reporterId: 'user-123',
    assigneeId: 'user-456',
    boardId: 'board-123',
    createdAt: new Date(),
  };



  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Board),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Sprint),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    taskService = module.get<TaskService>(TaskService);
    tasksRepository = module.get(getRepositoryToken(Task));
    boardsRepository = module.get(getRepositoryToken(Board));
    httpService = module.get(HttpService);
  });

  describe('Тестирование решений в методе deleteTask', () => {

    const decisionTable = [
      {
        testCase: '1',
        taskExists: true,
        isReporter: true,
        expectedResult: 'success',
        description: 'Задача существует и пользователь - создатель (true/false)'
      },
      {
        testCase: '2',
        taskExists: true,
        isReporter: false,
        expectedResult: 'ForbiddenException',
        description: 'Задача существует, но пользователь не создатель (true/false)'
      },
      {
        testCase: '3',
        taskExists: false,
        isReporter: false, 
        expectedResult: 'NotFoundException',
        description: 'Задача не существует (true/false)'
      },
      {
        testCase: '4',
        taskExists: false,
        isReporter: true, 
        expectedResult: 'NotFoundException',
        description: 'Задача не существует (true/false)'
      },
    ];

    decisionTable.forEach(({ testCase, taskExists, isReporter, expectedResult, description }) => {
            describe(`Тестовый случай ${testCase}: ${description}`, () => {
            it(`должен корректно обработать задачу`, async () => {
            const userId = 'current-user';

            const task = taskExists ? { 
            ...mockTask, 
            reporterId: isReporter ? userId : 'another-user' 
            } : null;

            
            jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(task as any);
            
            if (expectedResult === 'success') {
            jest.spyOn(tasksRepository, 'remove').mockResolvedValue(task as any);
            }
            
            if (expectedResult === 'success') {
            const result = await taskService.deleteTask('task-123', userId);
            console.log(`result.id: ${result.id}, task.id: ${task?.id}`)
            expect(result).toEqual(task);
            expect(tasksRepository.remove).toHaveBeenCalled();
            } else if (expectedResult === 'ForbiddenException') {
            await expect(taskService.deleteTask('task-123', userId))
                .rejects.toThrow(ForbiddenException);
            } else if (expectedResult === 'NotFoundException') {
            await expect(taskService.deleteTask('task-123', userId))
                .rejects.toThrow(NotFoundException);
            }
            expect(tasksRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'task-123' }
            });
        });
        });
    });
  });

  describe('Тестирование решений в методе updateTask', () => {
    it('должен обновить задачу, если она существует (решение true)', async () => {
        
        const findOneSpy = jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(mockTask as any);
        jest.spyOn(tasksRepository, 'save').mockResolvedValue({
            ...mockTask,
            title: 'Updated Title'
        } as any);

        const updateTaskDto = { title: 'Updated Title' };

        
        const result = await taskService.updateTask('task-123', updateTaskDto);

        
        expect(result.title).toBe('Updated Title');
        expect(tasksRepository.save).toHaveBeenCalled();
        expect(findOneSpy).toHaveBeenCalledWith({
            where: { id: 'task-123' }
        });
    });

    it('должен выбросить NotFoundException, если задача не существует (решение false)', async () => {
      
      jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(null);

      const updateTaskDto = { title: 'Updated Title' };

      
      await expect(taskService.updateTask('task-123', updateTaskDto))
        .rejects.toThrow(NotFoundException);
    });
  });

    describe('Тесты после выявленных первой мутацией уязвимостей  ', () => {
    it('должен обновить с Object.assign (эквивалентное решение)', async () => {
        jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(mockTask as any);
        jest.spyOn(tasksRepository, 'save').mockResolvedValue({ ...mockTask, status: TaskStatus.DONE } as any);
        const updateTaskDto = { status: TaskStatus.DONE };
        const result = await taskService.updateTask('task-123', updateTaskDto);
        expect(result.status).toBe(TaskStatus.DONE);
        expect(tasksRepository.save).toHaveBeenCalled();
    });

    it('должен выбросить точное сообщение в deleteTask (с решением task false)', async () => {
        jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(null);
        await expect(taskService.deleteTask('task-123', 'user')).rejects.toThrow('Task not found');
    });

    it('должен обновить статус задачи (решение: существует?)', async () => {
        const findOneSpy = jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(mockTask as any);
        jest.spyOn(tasksRepository, 'save').mockResolvedValue({ ...mockTask, status: TaskStatus.DONE, order: 1 } as any);
        const result = await taskService.updateTaskStatus('task-123', TaskStatus.DONE as any, 1);
        expect(result.status).toBe(TaskStatus.DONE);
        expect(result.order).toBe(1);
        expect(findOneSpy).toHaveBeenCalledWith({
            where: { id: 'task-123' }
        });
    });
    it('должен выбросить NotFoundException в updateTaskStatus (решение false)', async () => {
        jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(null);
        await expect(taskService.updateTaskStatus('task-999', TaskStatus.TODO as any, 0)).rejects.toThrow(NotFoundException);
    });
    it('должен вернуть задачи пользователя (эквивалентный класс по assigneeId)', async () => {
        jest.spyOn(tasksRepository, 'find').mockResolvedValue([mockTask]);
        const result = await taskService.getUserAssignedTasks('user-456');
        expect(result).toEqual([mockTask]);
        expect(tasksRepository.find).toHaveBeenCalledWith({
        where: { assigneeId: 'user-456' },
        relations: ['board'],
            order: { createdAt: 'DESC' },
        });
    });
    it('должен вернуть backlog задачи (эквивалентный класс по статусу)', async () => {
        jest.spyOn(tasksRepository, 'find').mockResolvedValue([mockTask]);
        const result = await taskService.getBacklogTasks('board-123');
        expect(result).toEqual([mockTask]);
    });
    it('должен вернуть задачи по спринту (эквивалентный класс)', async () => {
        jest.spyOn(tasksRepository, 'find').mockResolvedValue([mockTask]);
        await expect(taskService.findBySprint('sprint-123')).resolves.toEqual([mockTask]);
    });
    it('должен проверить findTaskById (решение: существует?)', async () => {
        const findOneSpy = jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(mockTask as any);
        await expect(taskService.findTaskById('task-123')).resolves.toEqual(mockTask);
        expect(findOneSpy).toHaveBeenCalledWith({
            where: { id: 'task-123' }
        });
    });
    it('должен выбросить NotFoundException в findTaskById (решение false)', async () => {
        jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(null);
        await expect(taskService.findTaskById('task-999')).rejects.toThrow(NotFoundException);
    });

    it('должен обновить задачей с эквивалентными обновлениями (класс валидных DTO)', async () => {
        jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(mockTask as any);
        jest.spyOn(tasksRepository, 'save').mockResolvedValue({ ...mockTask, priority: TaskPriority.HIGH } as any);
        const updateTaskDto = { priority: TaskPriority.HIGH };
        const result = await taskService.updateTask('task-123', updateTaskDto);
        expect(result.priority).toBe(TaskPriority.HIGH);
    });
    it('должен обновить статус на границе (эквивалентные статусы TODO/DONE)', async () => {
        jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(mockTask as any);
        jest.spyOn(tasksRepository, 'save').mockResolvedValue({ ...mockTask, status: TaskStatus.DONE } as any);
        const result = await taskService.updateTaskStatus('task-123', TaskStatus.DONE as any, 10);
        expect(result.status).toBe(TaskStatus.DONE);
    });




    it('должен вернуть задачи доски с правильным порядком', async () => {
        const mockTasks = [
        { ...mockTask, id: 'task-1', order: 1 },
        { ...mockTask, id: 'task-2', order: 2 }
        ];
        
        jest.spyOn(boardsRepository, 'findOne').mockResolvedValue(mockBoard as any);
        jest.spyOn(tasksRepository, 'find').mockResolvedValue(mockTasks);
        
        const result = await taskService.getBoardTasks('board-123');
        
        expect(result).toEqual(mockTasks);
        expect(tasksRepository.find).toHaveBeenCalledWith({
        where: { boardId: 'board-123' },
        order: { order: 'ASC', createdAt: 'DESC' }
        });
    });
    
    it('должен вернуть задачу по ID', async () => {
        jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(mockTask as any);
        
        const result = await taskService.getTaskById('task-123');
        
        expect(result).toEqual(mockTask);
        expect(tasksRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-123' }
        });
    });
    
    it('должен выбросить исключение если задача не найдена в getTaskById', async () => {
        jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(null);
        
        await expect(taskService.getTaskById('task-999'))
        .rejects.toThrow('Task not found');
    });
    it('должен использовать значение по умолчанию для статуса', async () => {
        jest.spyOn(boardsRepository, 'findOne').mockResolvedValue(mockBoard as any);
        jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error()));
        jest.spyOn(tasksRepository, 'create').mockReturnValue(mockTask as any);
        jest.spyOn(tasksRepository, 'save').mockResolvedValue(mockTask as any);
        // Не указываем статус (Partial)
        const createTaskDto: Partial<CreateTaskDto> = {
            title: 'Test Task',
            assigneeId: 'user-456',
            description: '',
            priority: TaskPriority.LOW,
            reporterId: '',
            tags: [],
            boardId: ''
        };
        
        await taskService.createTask('board-123', createTaskDto as CreateTaskDto, 'user-123');
        
        // Проверяем, что при создании задачи используется TaskStatus.TODO по умолчанию
        expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
            status: TaskStatus.TODO
        })
        );
    });
    
    it('должен отправлять уведомление только если assignee отличается от reporter', async () => {
        jest.spyOn(boardsRepository, 'findOne').mockResolvedValue(mockBoard as any);
        jest.spyOn(httpService, 'get').mockReturnValue(of({ data: { id: 'user-456' } } as any));
        jest.spyOn(tasksRepository, 'create').mockReturnValue(mockTask as any);
        jest.spyOn(tasksRepository, 'save').mockResolvedValue(mockTask as any);
        const postSpy = jest.spyOn(httpService, 'post').mockReturnValue(of({} as any));
        
        const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        assigneeId: 'user-456', // Отличается от currentUserId
        status: TaskStatus.TODO,
        description: '',
        priority: TaskPriority.LOW,
        reporterId: '',
        tags: [],
        boardId: ''
        };
        
        await taskService.createTask('board-123', createTaskDto, 'user-123');
        
        // Должен быть вызов отправки уведомления
        expect(postSpy).toHaveBeenCalled();
    });
    
    it('НЕ должен отправлять уведомление если assignee совпадает с reporter', async () => {
        jest.spyOn(boardsRepository, 'findOne').mockResolvedValue(mockBoard as any);
        jest.spyOn(httpService, 'get').mockReturnValue(of({ data: { id: 'user-123' } } as any));
        jest.spyOn(tasksRepository, 'create').mockReturnValue(mockTask as any);
        jest.spyOn(tasksRepository, 'save').mockResolvedValue(mockTask as any);
        const postSpy = jest.spyOn(httpService, 'post').mockReturnValue(of({} as any));
        
        const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        assigneeId: 'user-123', // Совпадает с currentUserId
        status: TaskStatus.TODO,
        description: '',
        priority: TaskPriority.LOW,
        reporterId: '',
        tags: [],
        boardId: ''
        };
        
        await taskService.createTask('board-123', createTaskDto, 'user-123');
        
        // НЕ должен быть вызов отправки уведомления
        expect(postSpy).not.toHaveBeenCalled();
    });



    it('должен проверять корректность данных в уведомлении', async () => {
  
    jest.spyOn(boardsRepository, 'findOne').mockResolvedValue(mockBoard as any);
    jest.spyOn(httpService, 'get').mockReturnValue(of({ data: { id: 'user-456' } } as any));
    
    const mockSavedTask = { ...mockTask, id: 'new-task-123' };
    jest.spyOn(tasksRepository, 'create').mockReturnValue(mockTask as any);
    jest.spyOn(tasksRepository, 'save').mockResolvedValue(mockSavedTask as any);
    
    const postSpy = jest.spyOn(httpService, 'post').mockReturnValue(of({} as any));
    
    const createTaskDto: CreateTaskDto = {
        title: 'Важная задача',
        assigneeId: 'user-456',
        status: TaskStatus.TODO,
        description: 'Описание задачи',
        priority: TaskPriority.HIGH,
        reporterId: '',
        tags: [],
        boardId: ''
    };
    
    
    await taskService.createTask('board-123', createTaskDto, 'user-123');
    
    // Проверяем  параметры уведомления
    expect(postSpy).toHaveBeenCalledWith(
        expect.any(String), // URL
        {
        userId: 'user-456',
        title: 'Новая задача назначена',
        message: 'Вам назначена задача "Важная задача"',
        type: 'task_assigned',
        data: {
            taskId: 'new-task-123',
            boardId: 'board-123',
            assignedBy: 'user-123'
        }
        }
    );
    });

    it('должен изменять assigneeId в блоке catch', async () => {
    
    jest.spyOn(boardsRepository, 'findOne').mockResolvedValue(mockBoard as any);
    jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('User not found')));
    jest.spyOn(tasksRepository, 'create').mockReturnValue(mockTask as any);
    jest.spyOn(tasksRepository, 'save').mockResolvedValue(mockTask as any);
    
    const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        assigneeId: 'non-existent-user',
        status: TaskStatus.TODO,
        description: '',
        priority: TaskPriority.LOW,
        reporterId: '',
        tags: [],
        boardId: ''
    };
    
    
    await taskService.createTask('board-123', createTaskDto, 'current-user-123');
    
    // Проверяем, что create вызывается с измененным assigneeId
    expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
        assigneeId: 'current-user-123' // Должен быть изменен после catch
        })
    );
    });

    it('должен вернуть backlog задачи с правильными параметрами запроса', async () => {
    
    const findSpy = jest.spyOn(tasksRepository, 'find').mockResolvedValue([mockTask]);
    
    
    const result = await taskService.getBacklogTasks('board-123');
    
    
    expect(result).toEqual([mockTask]);
    expect(findSpy).toHaveBeenCalledWith({
        where: {
        boardId: 'board-123',
        sprintId: IsNull(),
        status: TaskStatus.BACKLOG
        },
        order: { order: 'ASC' },
    });
    });

    it('должен вернуть задачи по спринту с правильным условием where', async () => {
    
    const findSpy = jest.spyOn(tasksRepository, 'find').mockResolvedValue([mockTask]);
    
    
    await taskService.findBySprint('sprint-123');
    
    
    expect(findSpy).toHaveBeenCalledWith({
        where: { sprintId: 'sprint-123' }
    });
    });

    it('должен выбросить NotFoundException с правильным сообщением в updateTask', async () => {
    
    jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(null);
    const updateTaskDto = { title: 'Updated Title' };

    
    await expect(taskService.updateTask('task-123', updateTaskDto))
        .rejects.toThrow('Task not found');
    });

    it('должен выбросить NotFoundException с правильным сообщением в updateTaskStatus', async () => {
    
    jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(null);

    
    await expect(taskService.updateTaskStatus('task-999', TaskStatus.TODO as any, 0))
        .rejects.toThrow('Task not found');
    });
    });
});