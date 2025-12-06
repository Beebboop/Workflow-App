/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AuthGuard } from './auth.guard';
import { PublicGuard } from './public.guards';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'KSmrsWqq1',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
    PublicGuard,
  ],
})
export class AppModule {}