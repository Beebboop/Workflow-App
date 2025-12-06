/* eslint-disable prettier/prettier */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Controller, Get, Put, Param, Query, Headers, Body, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, NotificationType } from '../../types/src';
import { WebSocketGatewayNotification } from '../websocket/websocket.gateway';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly webSocketGateway: WebSocketGatewayNotification
  ) {}

  @Get()
  async getNotifications(@Headers('x-user-id') userId: string) {
    if (!userId) {
      return { error: 'User ID is required' };
    }
    return this.notificationService.getUserNotifications(userId);
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      return { error: 'User ID is required' };
    }
    return await this.notificationService.markAsRead(notificationId, userId);
  }

  @Put('read-all')
  async markAllAsRead(@Headers('x-user-id') userId: string) {
    if (!userId) {
      return { error: 'User ID is required' };
    }
    await this.notificationService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Post()
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    const notification = await this.notificationService.createNotification(createNotificationDto);
    
    // Отправляем уведомление через WebSocket подключенному пользователю
    this.webSocketGateway.sendToUser(
      createNotificationDto.userId, 
      'new-notification', 
      notification
    );
    
    return notification;
  }

  @Get('unread-count')
  async getUnreadCount(@Headers('x-user-id') userId: string) {
    if (!userId) {
      return { error: 'User ID is required' };
    }
    const count = await this.notificationService.getUnreadCount(userId);
    return { unreadCount: count };
  }

 

  @Get('unread')
  async getUnreadNotifications(@Headers('x-user-id') userId: string) {
    if (!userId) {
      return { error: 'User ID is required' };
    }
    return this.notificationService.getUnreadNotifications(userId);
  }

  @Get('count')
  async getNotificationCount(@Headers('x-user-id') userId: string) {
    if (!userId) {
      return { error: 'User ID is required' };
    }
    return this.notificationService.getNotificationCount(userId);
  }
  @Get(':id/status')
  async getNotificationStatus(
    @Param('id') notificationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      return { error: 'User ID is required' };
    }
    
    const notification = await this.notificationService.getUserNotifications(userId);
    const targetNotification = notification.find(n => n.id === notificationId);
    
    return {
      notificationId,
      read: targetNotification?.read || false,
      exists: !!targetNotification
    };
  }

  @Post('sprint-created')
  async handleSprintCreated(
    @Body() eventData: {
      sprintId: string;
      sprintName: string;
      teamMembers: string[];
    }
    ) {
      try {
        console.log('Creating sprint started notifications for team members:', eventData.teamMembers);

        // Создаем уведомления для всех участников команды
        const notificationPromises = eventData.teamMembers.map(memberId =>
          this.notificationService.createSprintStartedNotification(
          memberId,
          eventData.sprintId,
          eventData.sprintName
        ).then(notification => {
          // Отправляем каждое уведомление через WebSocket
          this.webSocketGateway.sendToUser(memberId, 'new-notification', notification);
          return notification;
        }).catch(error => {
          console.error(`Failed to create notification for user ${memberId}:`, error.message);
          return null;
        })
      );

      const results = await Promise.all(notificationPromises);
      const successfulNotifications = results.filter(result => result !== null).length;
      
      console.log(`Created ${successfulNotifications}/${eventData.teamMembers.length} notifications for sprint "${eventData.sprintName}"`);

      return { 
        success: true, 
        message: `Created ${successfulNotifications} notifications`,
        notificationsCreated: successfulNotifications 
      };

    } catch (error) {
      console.error('Failed to create sprint notifications:', error);
      return { 
        success: false, 
        error: 'Failed to create sprint notifications' 
      };
    }
  }

  @Get('health')
  healthCheck() {
    return { status: 'OK', service: 'notification-service' };
  }

  @Get('websocket-health')
  async websocketHealthCheck() {
    return { 
      status: 'OK', 
      service: 'notification-service',
      websocket: 'active',
      timestamp: new Date().toISOString()
    }
  }

  @Post('test-real-time')
  async testRealTimeNotification(@Headers('x-user-id') userId: string) {
    if (!userId) {
      return { error: 'User ID is required' };
    }

    try {
      // Создаем тестовое уведомление
      const testNotification = await this.notificationService.createNotification({
        userId,
        title: 'Real-time Test',
        message: 'Это тестовое уведомление в реальном времени!',
        type: NotificationType.SPRINT_STARTED,
        data: { test: true }
      });

      // Отправляем через WebSocket
      this.webSocketGateway.sendToUser(userId, 'new-notification', testNotification);

      return { 
        success: true, 
        message: 'Test notification sent via WebSocket',
        notification: testNotification 
      };
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return { 
        success: false, 
        error: 'Failed to send test notification' 
      };
    }
  }
  
}