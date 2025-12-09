import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, User, UpdateUserDto } from '../../types/src/user';
import { JwtPayload } from '../../types/src/jwt-payloads';
interface RequestWithUser extends Request {
    user: JwtPayload;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        user: any;
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: Omit<import("../user.entity").User, "password">;
        token: string;
    }>;
    getUserById(userId: string): Promise<import("../user.entity").User>;
    updateUser(userId: string, updateUserDto: UpdateUserDto, headerUserId: string): Promise<import("../user.entity").User>;
    getUsers(): Promise<User[]>;
    getProfile(req: RequestWithUser): Promise<Omit<import("../user.entity").User, "password">>;
    refreshToken(req: RequestWithUser): Promise<{
        token: string;
    }>;
    healthCheck(): {
        status: string;
        service: string;
    };
}
export {};
