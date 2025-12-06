/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from './notification/notification.module';
import { Notification } from './entities/notification.entity';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'notification_service',
      entities: [Notification],
      synchronize: true,
    }),
    NotificationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'KSmrsWqq1',
      signOptions: { expiresIn: '24h' },
    }),
  ]
})
export class AppModule {}