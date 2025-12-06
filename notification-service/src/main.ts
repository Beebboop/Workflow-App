/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for both HTTP and WebSocket connections
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000','http://localhost:3003', "http://10.0.2.2:5173"],
    credentials: true,
  });
  
  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Notification service running on port ${port}`);
  console.log(`WebSocket gateway available on ws://localhost:${port}`);
}
bootstrap();