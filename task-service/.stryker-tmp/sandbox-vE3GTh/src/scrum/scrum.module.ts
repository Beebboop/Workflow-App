/* eslint-disable prettier/prettier */
// @ts-nocheck

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrumController } from './scrum.controller';
import { ScrumService } from './scrum.service';
import { Sprint } from '../entities/sprint.entity';
import { Task } from '../entities/task.entity';
import { Board } from '../entities/board.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sprint, Task, Board]),
    HttpModule,
  ],
  controllers: [ScrumController],
  providers: [ScrumService],
  exports: [ScrumService],
})
export class ScrumModule {}