/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, UseFilters, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Public } from './public.decorator';
import { PublicGuard } from './public.guards';
import { AuthGuard } from './auth.guard';
import { HttpExceptionFilter } from './http-exception.filter';
import {
  AuthResponse,
  User,
  CreateBoardRequest,
  CreateTaskRequest,
  AuthenticatedRequest,
  CreateSprintRequest
} from '../types/src';
import { AxiosResponse } from 'axios';
import {lastValueFrom } from 'rxjs';

@Controller()
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
export class AppController {
  constructor(private readonly httpService: HttpService) {}

  private services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    tasks: process.env.TASK_SERVICE_URL || 'http://task-service:3002',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003',
  };

  // Public routes - без аутентификации
  @Public()
  @UseGuards(PublicGuard)
  @Post('auth/login')
  async login(@Body() body: any) {
    try {
      const response: AxiosResponse<AuthResponse> = await lastValueFrom(
        this.httpService.post(`${this.services.auth}/auth/login`, body)
      );
      return response.data;
    } catch (error) {
      console.error('Gateway error:', error.response?.data || error.message); 
      throw error;
    }
  }

  @Public()
  @UseGuards(PublicGuard)
  @Post('auth/register')
  async register(@Body() body: any) {
    const response: AxiosResponse<AuthResponse> = await this.httpService.axiosRef.post(
      `${this.services.auth}/auth/register`,
      body
    );
    return response.data;
  }

  // Protected routes - требуют аутентификации
  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest): Promise<User> {
    const response: AxiosResponse<User> = await this.httpService.axiosRef.get(
      `${this.services.auth}/auth/profile`,
      { headers: { Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Get('users')
  async getUsers(@Request() req: AuthenticatedRequest): Promise<any> {
    const response: AxiosResponse<any> = await this.httpService.axiosRef.get(
      `${this.services.auth}/auth/users`,
      { headers: { Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Get('users/:userId')
  async getUserById(@Param('userId') userId: string, @Request() req: AuthenticatedRequest): Promise<any> {
    const response: AxiosResponse<any> = await this.httpService.axiosRef.get(
      `${this.services.auth}/auth/users/${userId}`,
      { headers: { Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Put('users/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: any,
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const currentUserId: string = req.user.id;
    
    // Проверяем, что пользователь обновляет свой собственный профиль
    if (userId !== currentUserId) {
      throw new HttpException('You can only update your own profile', HttpStatus.FORBIDDEN);
    }

    const response: AxiosResponse<any> = await this.httpService.axiosRef.put(
      `${this.services.auth}/auth/users/${userId}`,
      updateUserDto,
      { 
        headers: { 
          'X-User-Id': currentUserId, 
          Authorization: req.headers.authorization 
        }
      }
    );
    return response.data;
  }

  // Task routes
  @Get('boards')
  async getBoards(@Request() req: AuthenticatedRequest): Promise<any> {
    const userId: string = req.user.id; // Извлекаем из проверенного токена
    const response: AxiosResponse<any> = await this.httpService.axiosRef.get(
      `${this.services.tasks}/boards/boards`,
      { 
        params: { userId },
        headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } // Передаем в task-service
      }
    );
    return response.data;
  }

  @Post('boards')
  async createBoard(@Request() req: AuthenticatedRequest, @Body() body: CreateBoardRequest): Promise<any> {
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.post(
      `${this.services.tasks}/boards/boards`,
      body,
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Get('boards/:boardId/tasks')
  async getBoardTasks(
    @Request() req: AuthenticatedRequest, 
    @Param('boardId') boardId: string, 
    @Query('sprintId') sprintId?: string
  ): Promise<any> {
    const userId: string = req.user.id;
    
    try {
      console.log(`Fetching tasks for board ${boardId}, user ${userId}, sprint ${sprintId}`);
      
      const response: AxiosResponse<any> = await this.httpService.axiosRef.get(
        `${this.services.tasks}/tasks/boards/${boardId}/tasks`,
        { 
          params: { sprintId },
          headers: { 
            'X-User-Id': userId, 
            Authorization: req.headers.authorization 
          }
        }
      );
      console.log(`Successfully fetched ${response.data.length} tasks`);
      return response.data;
      
    } catch (error: any) {
      console.error('Error fetching board tasks:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        userId,
        boardId
      });
      throw error;
    }
  }

  @Post('boards/:boardId/tasks')
  async createTask(@Request() req: AuthenticatedRequest, 
      @Param('boardId') boardId: string, 
      @Body() body: CreateTaskRequest): Promise<any> {
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.post(
      `${this.services.tasks}/tasks/boards/${boardId}/tasks`,
      body,
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Delete('boards/:boardId')
  async deleteBoard(@Request() req: AuthenticatedRequest, 
      @Param('boardId') boardId: string): Promise<any> {
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.delete(
      `${this.services.tasks}/boards/boards/${boardId}`,
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  // Notification routes
  @Get('notifications')
  async getNotifications(@Request() req: AuthenticatedRequest): Promise<any> {
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.get(
      `${this.services.notifications}/notifications`,
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Post('notifications')
  async createNotification(@Request() req: AuthenticatedRequest, @Body() createNotificationDto: any): Promise<any> {
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.post(
      `${this.services.notifications}/notifications`,
      createNotificationDto,
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Put('notifications/:id/read')
  async markNotificationAsRead(@Request() req: AuthenticatedRequest, 
  @Param('id') notificationId: string): Promise<any> {
    console.log('I passed in api-gateway @Put(notifications/:id/read)')
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.put(
      `${this.services.notifications}/notifications/${notificationId}/read`,
      {},
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Put('notifications/read-all')
  async markAllNotificationsAsRead(@Request() req: AuthenticatedRequest): Promise<any> {
    console.log('API Gateway: Marking all notifications as read');
    
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.put(
      `${this.services.notifications}/notifications/read-all`,
      {},
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    
    console.log('API Gateway: All notifications marked as read successfully');
    return response.data;
  }

  @Put('tasks/:taskId')
  async updateTask(
    @Request() req: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() body: any
  ): Promise<any> {
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.put(
      `${this.services.tasks}/tasks/tasks/${taskId}`,
      body,
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    return response.data;
  }
  @Delete('tasks/:taskId')
  async deleteTask(
    @Request() req: AuthenticatedRequest,
    @Param('taskId') taskId: string
  ): Promise<any> {
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.delete(
      `${this.services.tasks}/tasks/tasks/${taskId}`,
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Get('boards/:boardId/sprints')
async getSprints(
  @Param('boardId') boardId: string,
  @Request() req: AuthenticatedRequest
  ): Promise<any> {
  const userId: string = req.user.id;
  
  const response: AxiosResponse<any> = await this.httpService.axiosRef.get(
    `${this.services.tasks}/scrum/boards/${boardId}/sprints`,
    { 
      headers: { 
        'X-User-Id': userId, 
        Authorization: req.headers.authorization 
      }
    }
  );
  return response.data;
}

  @Get('boards/:boardId/active-sprint')
  async getActiveSprint(@Param('boardId') boardId: string, @Request() req: AuthenticatedRequest): Promise<any> {
    const response: AxiosResponse<any> = await this.httpService.axiosRef.get(
      `${this.services.tasks}/scrum/boards/${boardId}/active-sprint`,
      {headers: { Authorization: req.headers.authorization }}
    );
    return response.data;
  }

  @Post('sprints')
  async createSprint(@Request() req: AuthenticatedRequest, @Body() body: CreateSprintRequest): Promise<any> {
    const userId: string = req.user.id;
    const response: AxiosResponse<any> = await this.httpService.axiosRef.post(
      `${this.services.tasks}/scrum/sprints`,
      body,
      { headers: { 'X-User-Id': userId, Authorization: req.headers.authorization } }
    );
    return response.data;
  }

  @Put('sprints/:sprintId/status')
  async updateSprintStatus(
    @Param('sprintId') sprintId: string,
    @Body('status') status: string,
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const response: AxiosResponse<any> = await this.httpService.axiosRef.put(
      `${this.services.tasks}/scrum/sprints/${sprintId}/status`,
      { status },
      {headers: { Authorization: req.headers.authorization }}
    );
    return response.data;
  }

  @Get('sprints/:sprintId/stats')
  async getSprintStats(@Param('sprintId') sprintId: string, @Request() req: AuthenticatedRequest): Promise<any> {
    const response: AxiosResponse<any> = await this.httpService.axiosRef.get(
      `${this.services.tasks}/scrum/sprints/${sprintId}/stats`,
      {headers: { Authorization: req.headers.authorization }}
    );
    return response.data;
  }

  @Put('sprints/:sprintId/tasks')
  async addTasksToSprint(
    @Param('sprintId') sprintId: string,
    @Body('taskIds') taskIds: string[],
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const response: AxiosResponse<any> = await this.httpService.axiosRef.put(
      `${this.services.tasks}/scrum/sprints/${sprintId}/tasks`,
      { taskIds },
      {headers: { Authorization: req.headers.authorization }}
    );
    return response.data;
  }

  @Delete('sprints/:sprintId')
  async deleteSprint(@Param('sprintId') sprintId: string, @Request() req: AuthenticatedRequest): Promise<any> {
    const response: AxiosResponse<any> = await this.httpService.axiosRef.delete(
      `${this.services.tasks}/scrum/sprints/${sprintId}`,
      {headers: { Authorization: req.headers.authorization }}
    );
    return response.data;
  }

  @Put('sprints/:sprintId/team')
  async updateSprintTeam(
    @Request() req: AuthenticatedRequest,
    @Param('sprintId') sprintId: string,
    @Body() teamData: { scrumMasterId: string; teamMembers: string[] }
  ): Promise<any> {
    const response: AxiosResponse<any> = await this.httpService.axiosRef.put(
      `${this.services.tasks}/scrum/sprints/${sprintId}/team`,
      teamData,
      {headers: { Authorization: req.headers.authorization }}
    );
    return response.data;
  }

  @Public()
  @UseGuards(PublicGuard)
  @Post('events/sprint-created')
  async handleSprintCreatedEvent(
    @Body() eventData: {
      sprintId: string;
      sprintName: string;
      teamMembers: string[];
    }
  ): Promise<any> {
    try {
      console.log('Proxying sprint created event to notification service:', eventData);
      const response: AxiosResponse<any> = await this.httpService.axiosRef.post(
        `${this.services.notifications}/notifications/sprint-created`,
        eventData
      );

      return response.data;

    } catch (error) {
      console.error('Failed to proxy sprint created event:', error);
      return { 
        success: false, 
        error: 'Failed to process sprint event' 
      };
    }
  }
}
  