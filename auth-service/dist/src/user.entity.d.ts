import { UserRole } from '../types/src';
export declare class User {
    id: string;
    email: string;
    name: string;
    password: string;
    role: UserRole;
    createdAt: Date;
}
