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
export declare enum TaskStatus {
    BACKLOG = "backlog",
    TODO = "todo",
    IN_PROGRESS = "in_progress",
    REVIEW = "review",
    DONE = "done",
    ARCHIVED = "archived"
}
export declare enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class CreateTaskDto {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assigneeId: string;
    reporterId: string;
    dueDate?: Date;
    estimate?: number;
    completedAt?: Date;
    tags: string[];
    boardId: string;
    sprintId?: string | null;
    constructor(data?: Partial<CreateTaskDto>);
}
export declare class UpdateTaskDto {
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
