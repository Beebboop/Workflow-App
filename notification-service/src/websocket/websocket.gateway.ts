/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service'

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173', 'http://10.0.2.2:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Cache-Control', 'Content-Type', 'Connection', 'Upgrade'],
  },
  transports: ['websocket', 'polling'],
  namespace: '/',
})
export class WebSocketGatewayNotification implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId
  private userUnreadCounts = new Map<string, number>(); // userId -> unreadCount

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    
    
  ) {}


  async handleConnection(client: Socket) {  
    
    // Проверяем аутентификацию при подключении
    const token = client.handshake.auth.token;
    if (!token) {
      client.emit('error', { message: 'Authentication token required' });
      client.disconnect();
      return;
    }

    try {
      const payload = await Promise.resolve(this.jwtService.verify(token));
      const userId = payload.id;
      
      // Сохраняем связь userId -> socketId
      this.userSockets.set(userId, client.id);
      client.data.userId = userId;

      // Инициализируем счетчик для пользователя
      if (!this.userUnreadCounts.has(userId)) {
        this.userUnreadCounts.set(userId, 0);
      }

      const unreadCount = this.userUnreadCounts.get(userId) || 0;
      
      console.log(`User ${userId} authenticated with socket ${client.id}`);
      client.emit('connected', { 
        message: 'Connected to notification service',
        userId: userId,
        unreadCount
      });
      
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.emit('error', { message: 'Invalid authentication token' });
      client.disconnect();
    }
    
    try {
      const payload = await Promise.resolve(this.jwtService.verify(token));
      const userId = payload.id;
      this.userSockets.set(userId, client.id);
      client.data.userId = userId;

      // Запрос и отправка полного списка на connect (из БД)
      const notifications = await this.notificationService.getUserNotifications(userId);
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      this.userUnreadCounts.set(userId, unreadCount);

      client.emit('notifications-full', { notifications, unreadCount: unreadCount });
      console.log(`Sent full notifications for user ${userId} on connect`);
    } catch (error) {
      console.error('WebSocket notifications load failed:', error);
      client.emit('error', { message: 'WebSocket notifications load failed' });
    }
  }

  handleDisconnect(client: Socket) {    
    // Удаляем из маппинга при отключении
    if (client.data.userId) {
      this.userSockets.delete(client.data.userId);
    }
  }

  @SubscribeMessage('mark-notification-read')
  async handleMarkNotificationRead(client: Socket, payload: { notificationId: string }): Promise<void> {
    try {
      const userId = client.data.userId;
      if (!userId) {
        client.emit('notification-read', { 
          success: false, 
          error: 'User not authenticated' 
        });
        return;
      }


      //  Обновляем в базе данных
      await this.notificationService.markAsRead(payload.notificationId, userId);
      
      // Обновляем локальный счетчик
      const currentCount = this.userUnreadCounts.get(userId) || 0;
      const newCount = Math.max(0, currentCount - 1);
      this.userUnreadCounts.set(userId, newCount);

      client.emit('notification-read', { 
        success: true, 
        notificationId: payload.notificationId 
      });

      // Отправляем обновленный счетчик
      client.emit('unread-count-updated', { unreadCount: newCount });
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      client.emit('notification-read', { 
        success: false, 
        error: 'Failed to mark notification as read' 
      });
    }
  }

  

  @SubscribeMessage('mark-all-notifications-read')
  async handleMarkAllNotificationsRead(client: Socket): Promise<void> {
    try {
      const userId = client.data.userId;
      if (!userId) {
        client.emit('all-notifications-read', { 
          success: false, 
          error: 'User not authenticated' 
        });
        return;
      }

      await this.notificationService.markAllAsRead(userId);

      console.log(`All notifications marked as read by user ${userId}`);

      // Сбрасываем счетчик
      this.userUnreadCounts.set(userId, 0);
      
      client.emit('all-notifications-read', { 
        success: true 
      });

      client.emit('unread-count-updated', { unreadCount: 0 });
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      client.emit('all-notifications-read', { 
        success: false, 
        error: 'Failed to mark all notifications as read' 
      });
    }
  }

  @SubscribeMessage('get-notifications')
  async handleGetNotifications(client: Socket): Promise<void> {
    try {
      const userId = client.data.userId;
      if (!userId) {
        client.emit('notifications-list', { 
          success: false, 
          error: 'User not authenticated' 
        });
        return;
      }

      // Получаем список уведомлений пользователя
      const notifications = await this.notificationService.getUserNotifications(userId);
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      
      // Отправка полного списка и count
      client.emit('notifications-full', { notifications });
      client.emit('unread-count-updated', { unreadCount });
      console.log(`Sent full notifications on get-notifications for ${userId}`);
    } catch (error) {
      console.error('Failed to get notifications:', error);
      client.emit('error', { message: 'Failed to fetch notifications' });
    }
  }

  @SubscribeMessage('get-unread-count')
  async handleGetUnreadCount(client: Socket): Promise<void> {
    try {
      const userId = await client.data.userId;
      if (!userId) {
        client.emit('unread-count', { 
          success: false, 
          error: 'User not authenticated' 
        });
        return;
      }

      const unreadCount = this.userUnreadCounts.get(userId) || 0;
      
      client.emit('unread-count', { 
        success: true,
        unreadCount 
      });
      
    } catch (error) {
      console.error('Failed to get unread count:', error);
      client.emit('unread-count', { 
        success: false, 
        error: 'Failed to get unread count' 
      });
    }
  }

  

   // метод для отправки уведомления конкретному пользователю
  sendToUser(userId: string, event: string, data: any): void {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      console.log(`Notification sent to user ${userId}: ${event}`);
    } else {
      console.log(`User ${userId} is not connected`);
    }
  }

  // метод для отправки уведомления всем пользователям
  broadcastToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }

  // метод для отправки уведомления группе пользователей
  sendToUsers(userIds: string[], event: string, data: any): void {
    userIds.forEach(userId => {
      this.sendToUser(userId, event, data);
    });
  }

  // Внешние методы для управления уведомлениями
  incrementUnreadCount(userId: string): void {
    const currentCount = this.userUnreadCounts.get(userId) || 0;
    const newCount = currentCount + 1;
    this.userUnreadCounts.set(userId, newCount);
    
    // Отправляем обновление подключенному пользователю
    this.sendToUser(userId, 'unread-count-updated', { unreadCount: newCount });
  }

}