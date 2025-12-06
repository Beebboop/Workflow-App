/* eslint-disable prettier/prettier */
// @ts-nocheck

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { Task } from '../entities/task.entity';
import { Board } from '../entities/board.entity';
import { Sprint } from '../entities/sprint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Board, Sprint]),
    HttpModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}