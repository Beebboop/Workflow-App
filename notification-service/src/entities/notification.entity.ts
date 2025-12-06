/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { NotificationType } from '../../types/src';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  type: NotificationType;

  @Column('jsonb', { nullable: true })
  data: any;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}