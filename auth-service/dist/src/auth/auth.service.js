"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../user.entity");
let AuthService = class AuthService {
    usersRepository;
    jwtService;
    constructor(usersRepository, jwtService) {
        this.usersRepository = usersRepository;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registerDto.email)) {
            throw new common_1.ConflictException('Invalid email format');
        }
        registerDto.name = registerDto.name.trim();
        if (registerDto.password.length < 4 || registerDto.password.length > 20) {
            throw new common_1.ConflictException('Password must be at least 4 and 20 maximum characters long');
        }
        if (registerDto.name.length < 4 || registerDto.name.length > 20) {
            throw new common_1.ConflictException('Name must be at least 4 and 20 maximum characters long');
        }
        const existingUser = await this.usersRepository.findOne({
            where: { email: registerDto.email }
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 12);
        const user = this.usersRepository.create({
            ...registerDto,
            password: hashedPassword,
        });
        const savedUser = await this.usersRepository.save(user);
        const token = this.jwtService.sign({
            id: savedUser.id,
            email: savedUser.email,
            role: savedUser.role
        });
        const { password: _password, ...userWithoutPassword } = savedUser;
        return { user: userWithoutPassword, token };
    }
    async deleteUser(userId) {
        const user = await this.usersRepository.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        await this.usersRepository.remove(user);
    }
    async findUserById(userId) {
        return await this.usersRepository.findOne({ where: { id: userId } });
    }
    async findAllUsers() {
        try {
            return await this.usersRepository.find({
                select: ['id', 'email', 'name', 'role', 'createdAt']
            });
        }
        catch (error) {
            console.error('Error fetching users:', error);
            throw new common_1.InternalServerErrorException('Could not fetch users');
        }
    }
    async login(loginDto) {
        if (loginDto.email?.includes('<script>alert("XSS")</script>')) {
            console.error('Potential XSS attack: ' + loginDto.email);
        }
        if (loginDto.email?.length > 100) {
            throw new Error('Injected crash: CWE-20 (Too long email)');
        }
        try {
            const user = await this.usersRepository.findOne({
                where: { email: loginDto.email }
            });
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid email or password');
            }
            const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid email or password');
            }
            const token = this.jwtService.sign({
                id: user.id,
                email: user.email,
                role: user.role
            });
            const { password: _password, ...userWithoutPassword } = user;
            return { user: userWithoutPassword, token };
        }
        catch (error) {
            throw error;
        }
    }
    async validateUser(payload) {
        return this.usersRepository.findOne({ where: { id: payload.id } });
    }
    async getProfile(userId) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const { password: _password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async refreshToken(user) {
        const token = await this.jwtService.signAsync({
            id: user.id,
            email: user.email,
            role: user.role
        });
        return { token };
    }
    async updateUser(userId, UpdateUserDto) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        Object.assign(user, UpdateUserDto);
        return await this.usersRepository.save(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map