/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TaskController } from './task/task.controller';
import { TaskService } from './task/task.service';
import { Task } from './entities/task.entity';
import { Board } from './entities/board.entity';
import { Sprint } from './entities/sprint.entity';
import { ScrumModule } from './scrum/scrum.module';
import { TaskModule } from './task/task.module';
import { BoardModule } from './board/board.module';
import { BoardController } from './board/board.controller';
import { ScrumController } from './scrum/scrum.controller';
import { BoardService } from './board/board.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Task, Board, Sprint],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Task, Board, Sprint]),
    HttpModule,
    ScrumModule,
    TaskModule,
    BoardModule
  ],
  controllers: [TaskController, BoardController, ScrumController],
  providers: [TaskService, BoardService, ScrumController],
})
export class AppModule {}