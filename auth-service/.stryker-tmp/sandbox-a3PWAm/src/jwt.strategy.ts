/* eslint-disable prettier/prettier */
// @ts-nocheck

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../types/src/jwt-payloads'


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'KSmrsWqq1',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    await Promise.resolve();
    return { 
      id: payload.id, 
      email: payload.email, 
      role: payload.role 
    };
  }
}