/* eslint-disable prettier/prettier */
// @ts-nocheck

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for WebSocket connections
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173','http://localhost:3003'], // API Gateway и Web App для CORS
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();