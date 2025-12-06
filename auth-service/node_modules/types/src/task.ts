/* eslint-disable prettier/prettier */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  reporterId: string;
  dueDate?: Date;
  completedAt?: Date;
  estimate?: number;
  tags?: string[];
  boardId: string;
  sprintId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  storyPoints?: number;
  order: number;
  sprintOrder: number;
}

export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  ARCHIVED = 'archived'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export class CreateTaskDto {
  title: string = '';
  description: string = '';
  priority: TaskPriority = TaskPriority.MEDIUM;
  status: TaskStatus = TaskStatus.TODO
  assigneeId: string = '';
  reporterId: string = '';
  dueDate?: Date = undefined;
  estimate?: number = undefined;
  completedAt?: Date = undefined;
  tags: string[] = [];
  boardId: string = '';
  sprintId?: string | null = null;

  constructor(data?: Partial<CreateTaskDto>) {
    if (data) {
      Object.assign(this, data);
    }
    this.status = this.status || TaskStatus.TODO;
  }
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  dueDate?: Date;
  estimate?: number;
  completedAt?: Date;
  tags?: string[];
  storyPoints?: number;
  order?: number;
  sprintOrder?: number;
  sprintId?: string | null;
}