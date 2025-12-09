import { TaskStatus } from "./task";
import type { User } from "./user";
import type { Request } from 'express';
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}
export interface AuthResponse {
    user: Omit<User, 'password'>;
    token: string;
}
export interface CreateBoardRequest {
    name: string;
    type: string;
    description?: string;
}
export interface CreateTaskRequest {
    title: string;
    description: string;
    priority: string;
    reporterId: string;
    assigneeId: string;
    dueDate?: string;
    estimate?: number;
    tags: string[];
    boardId: string;
    status: TaskStatus;
    sprintId?: string;
    storyPoints?: number;
}
export interface CreateSprintRequest {
    name: string;
    goal: string;
    startDate?: Date;
    endDate?: Date;
    boardId: string;
    scrumMasterId: string;
    teamMembers: string[];
}
export interface AuthenticatedRequest extends Request {
    user: User;
    headers: {
        authorization?: string;
    };
}
