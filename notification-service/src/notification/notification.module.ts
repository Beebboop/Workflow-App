/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { WebSocketGatewayNotification } from '../websocket/websocket.gateway';
import { Notification } from '../entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'KSmrsWqq1',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, WebSocketGatewayNotification],
  exports: [NotificationService],
})
export class NotificationModule {}