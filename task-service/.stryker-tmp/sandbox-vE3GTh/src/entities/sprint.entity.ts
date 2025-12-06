/* eslint-disable prettier/prettier */
// @ts-nocheck

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
import { SprintStatus } from '../../types/src';
import { Board } from './board.entity';
import { Task } from './task.entity';

@Entity()
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  goal: string;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;
  
  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column()
  boardId: string;

  @Column({
    type: 'enum',
    enum: SprintStatus,
    default: SprintStatus.PLANNING
  })
  status: SprintStatus;

  @Column({ default: 0 })
  velocity: number;

  @Column({ default: 0 })
  completedPoints: number;
  
  @Column({ type: 'varchar', nullable: true })
  scrumMasterId?: string | null;

  @Column('simple-array', { nullable: true })
  teamMembers?: string[] | null;

  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Board, board => board.sprints, { onDelete: 'CASCADE' })
  board: Board;

  @OneToMany(() => Task, task => task.sprint, { cascade: true })
  tasks: Task[];
}