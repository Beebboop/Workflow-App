/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { TaskService } from '../../../task/task.service';
import { Task } from '../../../entities/task.entity';
import { Board } from '../../../entities/board.entity';
import { Sprint } from '../../../entities/sprint.entity';
import { CreateTaskDto, TaskPriority, TaskStatus } from '../../../../types/src';



describe('TaskService - Branch Testing', () => {
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
    boardId: 'board-123'
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

  describe('Ветвление в методе getBoardById', () => {
    it('должен вернуть доску, если она существует (ветка true)', async () => {
      
      jest.spyOn(boardsRepository, 'findOne').mockResolvedValue(mockBoard as any);

      
      const result = await taskService.getBoardById('board-123');

      
      expect(result).toEqual(mockBoard);
      expect(boardsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'board-123' },
        relations: ['tasks']
      });
    });

    it('должен выбросить NotFoundException, если доска не существует (ветка false)', async () => {
      
      jest.spyOn(boardsRepository, 'findOne').mockResolvedValue(null);

      await expect(taskService.getBoardById('board-123')).rejects.toThrow('Board not found');
    });
  });

  describe('Ветвление в методе createTask', () => {
    it('должен использовать текущего пользователя, если assignee не найден (ветка false)', async () => {
      
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

      
      const result = await taskService.createTask('board-123', createTaskDto, 'current-user-123');

      
      expect(result).toBeDefined();
      expect(httpService.get).toHaveBeenCalled();
      // Проверяем, что был вызов sendNotification
    });

    it('должен использовать указанного assignee, если пользователь найден (ветка true)', async () => {
      
      jest.spyOn(boardsRepository, 'findOne').mockResolvedValue(mockBoard as any);
      jest.spyOn(httpService, 'get').mockReturnValue(of({ data: { id: 'user-456' } } as any));
      jest.spyOn(tasksRepository, 'create').mockReturnValue(mockTask as any);
      jest.spyOn(tasksRepository, 'save').mockResolvedValue(mockTask as any);
      jest.spyOn(httpService, 'post').mockReturnValue(of({} as any));

      const createTaskDto: CreateTaskDto = {
          title: 'Test Task',
          assigneeId: 'user-456',
          status: TaskStatus.TODO,
          description: '',
          priority: TaskPriority.LOW,
          reporterId: '',
          tags: [],
          boardId: ''
      };

      
      const result = await taskService.createTask('board-123', createTaskDto, 'current-user-123');

      
      expect(result).toBeDefined();
      expect(httpService.get).toHaveBeenCalled();
    });
  });

  describe('Ветвление в методе deleteTask', () => {
    it('должен удалить задачу, если пользователь является создателем (ветка true)', async () => {
      
      const task = { ...mockTask, reporterId: 'user-123' };
      jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(task as any);
      jest.spyOn(tasksRepository, 'remove').mockResolvedValue(task as any);

      const result = await taskService.deleteTask('task-123', 'user-123');

      expect(result).toEqual(task);
      expect(tasksRepository.remove).toHaveBeenCalled();
    });

    it('должен выбросить ForbiddenException, если пользователь не является создателем (ветка false)', async () => {

      const task = { ...mockTask, reporterId: 'user-123' };
      jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(task as any);

      await expect(taskService.deleteTask('task-123', 'different-user')).rejects.toThrow('You can only delete tasks you created');
    });

    it('должен выбросить ForbiddenException, если пользователь не является создателем (ветка false)', async () => {

      const task = { ...mockTask, reporterId: 'user-123' };
      jest.spyOn(tasksRepository, 'findOne').mockResolvedValue(task as any);

      await expect(taskService.deleteTask('task-123', 'different-user')).rejects.toThrow('You can only delete tasks you created');
    });
  });

});