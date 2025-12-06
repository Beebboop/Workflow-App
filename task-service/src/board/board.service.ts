/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Board } from '../entities/board.entity';
import { Sprint } from '../entities/sprint.entity';
import { CreateBoardDto } from '../../types/src';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Board)
    private readonly boardsRepository: Repository<Board>,
    @InjectRepository(Sprint)
    private readonly sprintsRepository: Repository<Sprint>,
    private readonly httpService: HttpService,
  ) {}

  async createBoard(createBoardDto: CreateBoardDto): Promise<Board> {
    const board = this.boardsRepository.create(createBoardDto);
    return this.boardsRepository.save(board);
  }

  async getUserBoards(userId: string): Promise<Board[]> {
    return this.boardsRepository.find({
      where: [
        { ownerId: userId },
        { members: Raw(alias => `${alias} @> :userId`, { userId: JSON.stringify([userId]) }) }
      ],
      relations: ['tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBoardById(boardId: string): Promise<Board> {
    const board = await this.boardsRepository.findOne({
      where: { id: boardId },
      relations: ['tasks'],
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }
  async deleteBoard(userId: string, boardId: string): Promise<Board> {
    const board = await this.getBoardById(boardId);
        if (!board) {
          throw new NotFoundException('Board not found');
        }
        if (board.ownerId !== userId) {
          throw new ForbiddenException('Only the owner can delete the board');
        }
    return this.boardsRepository.remove(board);
  }
}