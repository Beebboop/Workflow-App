/* eslint-disable prettier/prettier */
// @ts-nocheck

import { Controller, Get, Post, Body, Param, Headers, Delete, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from '../../types/src';

@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get('boards')
  async getBoards(@Headers('x-user-id') userId: string) {
    return this.boardService.getUserBoards(userId);
  }

  @Post('boards')
  async createBoard(
    @Body() createBoardDto: CreateBoardDto,
    @Headers('x-user-id') userId: string
  ) {
    return this.boardService.createBoard({ ...createBoardDto, ownerId: userId });
  }

  @Delete('boards/:boardId') 
  async deleteBoard(
    @Param('boardId') boardId: string,
    @Headers('x-user-id') userId: string
  ) {
    return this.boardService.deleteBoard(userId, boardId);
  }

  private async checkBoardAccess(boardId: string, userId: string):Promise<void> {
    const board = await this.boardService.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    
    const hasAccess = board.ownerId === userId || board.members?.includes(userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }
  }
  
}