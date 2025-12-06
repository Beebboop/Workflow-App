/* eslint-disable prettier/prettier */
// @ts-nocheck

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // удаляет поля не описанные в DTO
    forbidNonWhitelisted: true, // выбрасывает ошибку если есть лишние поля
    transform: true, // автоматически преобразует типы
  }));
  await app.listen(3001);
}
bootstrap();