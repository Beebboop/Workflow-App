import type { Task } from './task';
export interface Sprint {
    id: string;
    name: string;
    goal: string;
    startDate?: Date;
    endDate?: Date;
    boardId: string;
    status: SprintStatus;
    velocity: number;
    completedPoints: number;
    createdAt: Date;
    updatedAt: Date;
    scrumMasterId: string;
    teamMembers: string[];
}
export interface SprintTeamMember {
    userId: string;
    role: SprintRole;
    joinedAt: Date;
}
export declare enum SprintRole {
    SCRUM_MASTER = "scrum_master",
    TEAM_MEMBER = "team_member"
}
export declare enum SprintStatus {
    PLANNING = "planning",
    ACTIVE = "active",
    COMPLETED = "completed"
}
export interface SprintStats {
    totalPoints: number;
    completedPoints: number;
    remainingPoints: number;
    completedTasks: number;
    totalTasks: number;
    burndownData: BurndownDataPoint[];
}
export interface BurndownDataPoint {
    date: string;
    ideal: number;
    actual: number;
    remaining: number;
}
export declare class CreateSprintDto {
    name: string;
    goal: string;
    startDate?: Date;
    endDate?: Date;
    boardId: string;
    scrumMasterId: string;
    teamMembers: string[];
    constructor(data?: Partial<CreateSprintDto>);
}
export declare class UpdateSprintDto {
    name?: string;
    goal?: string;
    startDate?: Date;
    endDate?: Date;
    boardId?: string;
    scrumMasterId?: string;
    teamMembers?: string[];
    status?: SprintStatus;
    velocity?: number;
    completedPoints?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface SprintTask extends Task {
    storyPoints: number;
}
