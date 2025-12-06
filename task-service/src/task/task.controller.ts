/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Body, Param, Headers, Delete, NotFoundException, ForbiddenException, Query } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, TaskStatus, UpdateTaskDto } from '../../types/src';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('boards/:boardId/tasks')
  async getBoardTasks(
    @Param('boardId') boardId: string,
    @Headers('x-user-id') userId: string,
    @Query('sprintId') sprintId?: string
  ) {
    //console.log(`Task Controller: Getting tasks for board ${boardId}, sprint ${sprintId}, user ${userId}`);
    
    await this.checkBoardAccess(boardId, userId);
    return this.taskService.getBoardTasks(boardId);
  }

  @Post('boards/:boardId/tasks')
  async createTask(
    @Param('boardId') boardId: string, 
    @Body() createTaskDto: CreateTaskDto,
    @Headers('x-user-id') userId: string
  ) {
    await this.checkBoardAccess(boardId, userId);
    return this.taskService.createTask(boardId, createTaskDto, userId);
  }


  @Put('tasks/:taskId')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Headers('x-user-id') userId: string
  ) {
    const task = await this.taskService.findTaskById(taskId); 
    await this.checkBoardAccess(task.boardId, userId);
    return this.taskService.updateTask(taskId, updateTaskDto);
  }

  @Delete('tasks/:taskId')
  async deleteTask(
    @Param('taskId') taskId: string,
    @Headers('x-user-id') userId: string
  ) {
    const task = await this.taskService.findTaskById(taskId);
    await this.checkBoardAccess(task.boardId, userId);
    return this.taskService.deleteTask(taskId, userId);
  }

  @Put('tasks/:taskId/status')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body('status') status: TaskStatus,
    @Body('order') order: number,
    @Headers('x-user-id') userId: string
  ) {
    const task = await this.taskService.findTaskById(taskId);
    await this.checkBoardAccess(task.boardId, userId);
    return this.taskService.updateTaskStatus(taskId, status, order);
  }

  @Get('users/:userId/assigned-tasks')
  getUserAssignedTasks(
    @Param('userId') userId: string,
  @Headers('x-user-id') headerUserId: string) {
    if (userId !== headerUserId) {
      throw new ForbiddenException('Access denied');
    }
    return this.taskService.getUserAssignedTasks(userId);
  }


  private async checkBoardAccess(boardId: string, userId: string):Promise<void> {
    const board = await this.taskService.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    
    const hasAccess = board.ownerId === userId || board.members?.includes(userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }
  }
  
}