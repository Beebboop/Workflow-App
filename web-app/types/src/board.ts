/* eslint-disable prettier/prettier */
import { TaskStatus } from 'src/task';

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

export enum BoardType {
  KANBAN = 'kanban',
  SCRUM = 'scrum'
}

export interface BoardColumn {
  id: string;
  name: string;
  status: TaskStatus;
  order: number;
}

export class CreateBoardDto {
  name: string = '';
  type: BoardType = BoardType.KANBAN;
  description?: string = undefined;
  ownerId: string = '';
  members?: string[] = [];

  constructor(data?: Partial<CreateBoardDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}