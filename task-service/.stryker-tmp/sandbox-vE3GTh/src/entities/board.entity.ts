/* eslint-disable prettier/prettier */
// @ts-nocheck

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { BoardType } from '../../types/src';
import { Task } from './task.entity';
import { Sprint } from './sprint.entity'

@Entity()
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: BoardType
  })
  type: BoardType;

  @Column({ nullable: true })
  description: string;

  @Column()
  ownerId: string;
  
  @Column('jsonb', { default: [] })
  members: string[];

  @Column('jsonb', { default: [] })
  columns: any[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Task, task => task.board, { cascade: true })
  tasks: Task[];

  @OneToMany(() => Sprint, sprint => sprint.board, { cascade: true })
  sprints: Sprint[];
}