/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { TaskService } from '../../../task/task.service';
import { Task } from '../../../entities/task.entity';
import { Board } from '../../../entities/board.entity';
import { Sprint } from '../../../entities/sprint.entity';

export class BddTestingModule {
  static async createTaskModule() {
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

    return {
      taskService: module.get<TaskService>(TaskService),
      tasksRepository: module.get(getRepositoryToken(Task)),
      boardsRepository: module.get(getRepositoryToken(Board)),
      httpService: module.get<HttpService>(HttpService),
    };
  }
}