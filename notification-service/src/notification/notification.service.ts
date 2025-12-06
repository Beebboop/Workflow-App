/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto, NotificationType } from '../../types/src';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {

    const notification = this.notificationRepository.create(createNotificationDto);
    const savedNotification = await this.notificationRepository.save(notification);
    return savedNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId, read: false },
      order: { createdAt: 'DESC' },
    });
  }

   async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true }
    );
  }
   async getNotificationCount(userId: string): Promise<{ total: number; unread: number }> {
    const [total, unread] = await Promise.all([
      this.notificationRepository.count({ where: { userId } }),
      this.notificationRepository.count({ where: { userId, read: false } }),
    ]);

    return { total, unread };
  }

  // Методы для создания уведомлений(примеры, потом переделаю)
  async createTaskAssignedNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    assignedBy: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      title: 'Новая задача назначена',
      message: `Вам назначена задача "${taskTitle}"`,
      type: NotificationType.TASK_ASSIGNED,
      data: { taskId, assignedBy },
    });
  }

  async createTaskUpdatedNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    updatedBy: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      title: 'Задача обновлена',
      message: `Задача "${taskTitle}" была обновлена`,
      type: NotificationType.TASK_UPDATED,
      data: { taskId, updatedBy },
    });
  }

  async createSprintStartedNotification(
    userId: string,
    sprintId: string,
    sprintName: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      title: 'Спринт начат',
      message: `Спринт "${sprintName}" начался`,
      type: NotificationType.SPRINT_STARTED,
      data: { sprintId, sprintName },
    });
  }

  async createDeadlineApproachingNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    daysLeft: number
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      title: 'Приближается дедлайн',
      message: `До дедлайна задачи "${taskTitle}" осталось ${daysLeft} дней`,
      type: NotificationType.DEADLINE_APPROACHING,
      data: { taskId, daysLeft },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }


}