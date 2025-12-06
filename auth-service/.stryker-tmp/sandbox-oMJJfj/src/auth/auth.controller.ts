/* eslint-disable prettier/prettier */
// @ts-nocheck

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { Controller, Post, Body, Get, UseGuards, Put, Request, Param, Headers, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, User, UpdateUserDto } from '../../types/src/user';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { JwtPayload } from '../../types/src/jwt-payloads';
interface RequestWithUser extends Request {
  user: JwtPayload;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  async register(@Body()
  registerDto: RegisterDto) {
    if (stryMutAct_9fa48("0")) {
      {}
    } else {
      stryCov_9fa48("0");
      return this.authService.register(registerDto);
    }
  }
  @Post('login')
  async login(@Body()
  loginDto: LoginDto) {
    if (stryMutAct_9fa48("1")) {
      {}
    } else {
      stryCov_9fa48("1");
      return this.authService.login(loginDto);
    }
  }
  @Get('users/:userId')
  async getUserById(@Param('userId')
  userId: string) {
    if (stryMutAct_9fa48("2")) {
      {}
    } else {
      stryCov_9fa48("2");
      const user = await this.authService.findUserById(userId);
      if (stryMutAct_9fa48("5") ? false : stryMutAct_9fa48("4") ? true : stryMutAct_9fa48("3") ? user : (stryCov_9fa48("3", "4", "5"), !user)) {
        if (stryMutAct_9fa48("6")) {
          {}
        } else {
          stryCov_9fa48("6");
          throw new NotFoundException(stryMutAct_9fa48("7") ? "" : (stryCov_9fa48("7"), 'User not found'));
        }
      }
      return user;
    }
  }
  @Put('users/:userId')
  async updateUser(@Param('userId')
  userId: string, @Body()
  updateUserDto: UpdateUserDto, @Headers('x-user-id')
  headerUserId: string) {
    if (stryMutAct_9fa48("8")) {
      {}
    } else {
      stryCov_9fa48("8");
      // Проверяем, что пользователь обновляет свой собственный профиль
      if (stryMutAct_9fa48("11") ? userId === headerUserId : stryMutAct_9fa48("10") ? false : stryMutAct_9fa48("9") ? true : (stryCov_9fa48("9", "10", "11"), userId !== headerUserId)) {
        if (stryMutAct_9fa48("12")) {
          {}
        } else {
          stryCov_9fa48("12");
          throw new ForbiddenException(stryMutAct_9fa48("13") ? "" : (stryCov_9fa48("13"), 'You can only update your own profile'));
        }
      }
      const user = await this.authService.findUserById(userId);
      if (stryMutAct_9fa48("16") ? false : stryMutAct_9fa48("15") ? true : stryMutAct_9fa48("14") ? user : (stryCov_9fa48("14", "15", "16"), !user)) {
        if (stryMutAct_9fa48("17")) {
          {}
        } else {
          stryCov_9fa48("17");
          throw new NotFoundException(stryMutAct_9fa48("18") ? "" : (stryCov_9fa48("18"), 'User not found'));
        }
      }

      // Обновляем пользователя
      const updatedUser = await this.authService.updateUser(userId, updateUserDto);
      return updatedUser;
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsers(): Promise<User[]> {
    if (stryMutAct_9fa48("19")) {
      {}
    } else {
      stryCov_9fa48("19");
      return this.authService.findAllUsers();
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request()
  req: RequestWithUser) {
    if (stryMutAct_9fa48("20")) {
      {}
    } else {
      stryCov_9fa48("20");
      return this.authService.getProfile(req.user.id);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refreshToken(@Request()
  req: RequestWithUser) {
    if (stryMutAct_9fa48("21")) {
      {}
    } else {
      stryCov_9fa48("21");
      return this.authService.refreshToken(req.user);
    }
  }
  @Get('health')
  healthCheck() {
    if (stryMutAct_9fa48("22")) {
      {}
    } else {
      stryCov_9fa48("22");
      return stryMutAct_9fa48("23") ? {} : (stryCov_9fa48("23"), {
        status: stryMutAct_9fa48("24") ? "" : (stryCov_9fa48("24"), 'OK'),
        service: stryMutAct_9fa48("25") ? "" : (stryCov_9fa48("25"), 'auth-service')
      });
    }
  }
}