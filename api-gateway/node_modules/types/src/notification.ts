/* eslint-disable prettier/prettier */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  COMMENT_ADDED = 'comment_added',
  SPRINT_STARTED = 'sprint_started',
  DEADLINE_APPROACHING = 'deadline_approaching'
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
}