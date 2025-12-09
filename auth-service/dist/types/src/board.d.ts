import { TaskStatus } from './task';
export interface Board {
    id: string;
    name: string;
    type: BoardType;
    description?: string;
    ownerId: string;
    columns: BoardColumn[];
    createdAt: Date;
    members?: string[];
}
export declare enum BoardType {
    KANBAN = "kanban",
    SCRUM = "scrum"
}
export interface BoardColumn {
    id: string;
    name: string;
    status: TaskStatus;
    order: number;
}
export declare class CreateBoardDto {
    name: string;
    type: BoardType;
    description?: string;
    ownerId: string;
    members?: string[];
    constructor(data?: Partial<CreateBoardDto>);
}
