/* eslint-disable prettier/prettier */
// @ts-nocheck

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}