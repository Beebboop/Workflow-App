/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { TaskStatus, TaskPriority } from '../../types/src';
import { Board } from './board.entity';
import { Sprint } from './sprint.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.BACKLOG
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  priority?: TaskPriority;

  @Column()
  assigneeId: string;

  @Column()
  reporterId: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'int', nullable: true })
  estimate?: number;

  @Column({ type: 'int', nullable: true })
  storyPoints?: number;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column()
  boardId: string;

  @Column({ type: 'varchar', nullable: true })
  sprintId?: string | null;

  @Column({ default: 0 })
  order?: number;

  @Column({ default: 0 })
  sprintOrder?: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => Board, board => board.tasks, { onDelete: 'CASCADE' })
  board?: Board;

  @ManyToOne(() => Sprint, sprint => sprint.tasks, { onDelete: 'CASCADE' })
  sprint?: Sprint;
}