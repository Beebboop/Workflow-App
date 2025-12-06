/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Board } from '../entities/board.entity';
import { Sprint } from '../entities/sprint.entity';
import { CreateTaskDto, TaskStatus, UpdateTaskDto } from '../../types/src';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Board)
    private readonly boardsRepository: Repository<Board>,
    @InjectRepository(Sprint)
    private readonly sprintsRepository: Repository<Sprint>,
    private readonly httpService: HttpService,
  ) {}

  async getBoardById(boardId: string): Promise<Board> {
    const board = await this.boardsRepository.findOne({
      where: { id: boardId },
      relations: ['tasks'],
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async createTask(boardId: string, createTaskDto: CreateTaskDto, currentUserId: string): Promise<Task> {
    const board = await this.getBoardById(boardId);
    
    try {
      await firstValueFrom(
        this.httpService.get(`${process.env.API_GATEWAY_URL || 'http://api-gateway:3000'}/users/${createTaskDto.assigneeId}`)
      );
    } catch (error) {
      // console.log('Error', error)
      // console.warn(`Assignee ${createTaskDto.assigneeId} not found, using current user: ${currentUserId}`);
      createTaskDto.assigneeId = currentUserId;
    }

    const task = this.tasksRepository.create({
      ...createTaskDto,
      boardId: board.id,
      reporterId: currentUserId,
      status: createTaskDto.status || TaskStatus.TODO,
    });

    const savedTask = await this.tasksRepository.save(task);

    if (createTaskDto.assigneeId !== currentUserId) {
    await this.sendNotification({
        userId: createTaskDto.assigneeId,
        title: 'Новая задача назначена',
        message: `Вам назначена задача "${createTaskDto.title}"`,
        type: 'task_assigned',
        data: {
          taskId: savedTask.id,
          boardId: boardId,
          assignedBy: currentUserId
        }
      });
    }

    return savedTask;

  }

  async getBoardTasks(boardId: string): Promise<Task[]> {
    await this.getBoardById(boardId);
    return this.tasksRepository.find({
      where: { boardId },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async getTaskById(taskId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }


  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    Object.assign(task, updateTaskDto);
    task.updatedAt = new Date();

    return await this.tasksRepository.save(task);
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, order: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.status = status;
    task.order = order;

    return this.tasksRepository.save(task);
  }

  async deleteTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.reporterId !== userId) {
      throw new ForbiddenException('You can only delete tasks you created');
    }

    return this.tasksRepository.remove(task);
  }

  async getUserAssignedTasks(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { assigneeId: userId },
      relations: ['board'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBacklogTasks(boardId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { 
        boardId,
        sprintId: IsNull(),
        status: TaskStatus.BACKLOG
      },
      order: { order: 'ASC' },
    });
  }

  async findBySprint(sprintId: string): Promise<Task[]> {
    return this.tasksRepository.find({ where: { sprintId } });
  }

  async findTaskById(taskId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if(!task) throw new NotFoundException
    return task;
  }

  private async sendNotification(notificationData: any) {
  try {
    await firstValueFrom(
      this.httpService.post(
        `${process.env.API_GATEWAY_URL || 'http://api-gateway:3000'}/notifications`,
        notificationData
      )
    );
  } catch (error) {
       console.error('Failed to send notification:', error);
    }
  }
}