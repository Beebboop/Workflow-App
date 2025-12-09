export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    password: string;
}
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin"
}
export declare class LoginDto {
    email: string;
    password: string;
    constructor(data?: Partial<LoginDto>);
}
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    constructor(data?: Partial<RegisterDto>);
}
export declare class UpdateUserDto {
    name?: string;
}
