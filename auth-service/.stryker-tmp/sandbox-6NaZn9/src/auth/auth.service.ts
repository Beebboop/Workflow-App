/* eslint-disable prettier/prettier */
// @ts-nocheck

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */function stryNS_9fa48() {
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
import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user.entity';
import { RegisterDto, LoginDto, UpdateUserDto } from '../../types/src/user';
import { JwtPayload } from '../../types/src/jwt-payloads';
@Injectable()
export class AuthService {
  constructor(@InjectRepository(User)
  private usersRepository: Repository<User>, private jwtService: JwtService) {}
  async register(registerDto: RegisterDto): Promise<{
    user: any;
    token: string;
  }> {
    if (stryMutAct_9fa48("0")) {
      {}
    } else {
      stryCov_9fa48("0");
      const emailRegex = stryMutAct_9fa48("11") ? /^[^\s@]+@[^\s@]+\.[^\S@]+$/ : stryMutAct_9fa48("10") ? /^[^\s@]+@[^\s@]+\.[\s@]+$/ : stryMutAct_9fa48("9") ? /^[^\s@]+@[^\s@]+\.[^\s@]$/ : stryMutAct_9fa48("8") ? /^[^\s@]+@[^\S@]+\.[^\s@]+$/ : stryMutAct_9fa48("7") ? /^[^\s@]+@[\s@]+\.[^\s@]+$/ : stryMutAct_9fa48("6") ? /^[^\s@]+@[^\s@]\.[^\s@]+$/ : stryMutAct_9fa48("5") ? /^[^\S@]+@[^\s@]+\.[^\s@]+$/ : stryMutAct_9fa48("4") ? /^[\s@]+@[^\s@]+\.[^\s@]+$/ : stryMutAct_9fa48("3") ? /^[^\s@]@[^\s@]+\.[^\s@]+$/ : stryMutAct_9fa48("2") ? /^[^\s@]+@[^\s@]+\.[^\s@]+/ : stryMutAct_9fa48("1") ? /[^\s@]+@[^\s@]+\.[^\s@]+$/ : (stryCov_9fa48("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"), /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      if (stryMutAct_9fa48("14") ? false : stryMutAct_9fa48("13") ? true : stryMutAct_9fa48("12") ? emailRegex.test(registerDto.email) : (stryCov_9fa48("12", "13", "14"), !emailRegex.test(registerDto.email))) {
        if (stryMutAct_9fa48("15")) {
          {}
        } else {
          stryCov_9fa48("15");
          throw new ConflictException(stryMutAct_9fa48("16") ? "" : (stryCov_9fa48("16"), 'Invalid email format'));
        }
      }
      registerDto.name = stryMutAct_9fa48("17") ? registerDto.name : (stryCov_9fa48("17"), registerDto.name.trim());
      if (stryMutAct_9fa48("20") ? registerDto.password.length < 4 && registerDto.password.length > 20 : stryMutAct_9fa48("19") ? false : stryMutAct_9fa48("18") ? true : (stryCov_9fa48("18", "19", "20"), (stryMutAct_9fa48("23") ? registerDto.password.length >= 4 : stryMutAct_9fa48("22") ? registerDto.password.length <= 4 : stryMutAct_9fa48("21") ? false : (stryCov_9fa48("21", "22", "23"), registerDto.password.length < 4)) || (stryMutAct_9fa48("26") ? registerDto.password.length <= 20 : stryMutAct_9fa48("25") ? registerDto.password.length >= 20 : stryMutAct_9fa48("24") ? false : (stryCov_9fa48("24", "25", "26"), registerDto.password.length > 20)))) {
        if (stryMutAct_9fa48("27")) {
          {}
        } else {
          stryCov_9fa48("27");
          throw new ConflictException(stryMutAct_9fa48("28") ? "" : (stryCov_9fa48("28"), 'Password must be at least 4 and 20 maximum characters long'));
        }
      }
      if (stryMutAct_9fa48("31") ? registerDto.name.length < 4 && registerDto.name.length > 20 : stryMutAct_9fa48("30") ? false : stryMutAct_9fa48("29") ? true : (stryCov_9fa48("29", "30", "31"), (stryMutAct_9fa48("34") ? registerDto.name.length >= 4 : stryMutAct_9fa48("33") ? registerDto.name.length <= 4 : stryMutAct_9fa48("32") ? false : (stryCov_9fa48("32", "33", "34"), registerDto.name.length < 4)) || (stryMutAct_9fa48("37") ? registerDto.name.length <= 20 : stryMutAct_9fa48("36") ? registerDto.name.length >= 20 : stryMutAct_9fa48("35") ? false : (stryCov_9fa48("35", "36", "37"), registerDto.name.length > 20)))) {
        if (stryMutAct_9fa48("38")) {
          {}
        } else {
          stryCov_9fa48("38");
          throw new ConflictException(stryMutAct_9fa48("39") ? "" : (stryCov_9fa48("39"), 'Name must be at least 4 and 20 maximum characters long'));
        }
      }
      //console.log('Register attempt for email:', registerDto.email);

      const existingUser = await this.usersRepository.findOne(stryMutAct_9fa48("40") ? {} : (stryCov_9fa48("40"), {
        where: stryMutAct_9fa48("41") ? {} : (stryCov_9fa48("41"), {
          email: registerDto.email
        })
      }));

      //console.log('Existing user found:', existingUser);

      if (stryMutAct_9fa48("43") ? false : stryMutAct_9fa48("42") ? true : (stryCov_9fa48("42", "43"), existingUser)) {
        if (stryMutAct_9fa48("44")) {
          {}
        } else {
          stryCov_9fa48("44");
          //console.log('User already exists with ID:', existingUser.id);
          throw new ConflictException(stryMutAct_9fa48("45") ? "" : (stryCov_9fa48("45"), 'User with this email already exists'));
        }
      }
      const hashedPassword: string = await bcrypt.hash(registerDto.password, 12);
      const user = this.usersRepository.create(stryMutAct_9fa48("46") ? {} : (stryCov_9fa48("46"), {
        ...registerDto,
        password: hashedPassword
      }));
      const savedUser = await this.usersRepository.save(user);
      const token = this.jwtService.sign({
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role
      } as JwtPayload);

      // Возвращаем пользователя без пароля
      const {
        password: _password,
        ...userWithoutPassword
      } = savedUser;
      return stryMutAct_9fa48("47") ? {} : (stryCov_9fa48("47"), {
        user: userWithoutPassword,
        token
      });
    }
  }
  async findUserById(userId: string): Promise<User | null> {
    if (stryMutAct_9fa48("48")) {
      {}
    } else {
      stryCov_9fa48("48");
      return await this.usersRepository.findOne(stryMutAct_9fa48("49") ? {} : (stryCov_9fa48("49"), {
        where: stryMutAct_9fa48("50") ? {} : (stryCov_9fa48("50"), {
          id: userId
        })
      }));
    }
  }
  async findAllUsers(): Promise<User[]> {
    if (stryMutAct_9fa48("51")) {
      {}
    } else {
      stryCov_9fa48("51");
      try {
        if (stryMutAct_9fa48("52")) {
          {}
        } else {
          stryCov_9fa48("52");
          return await this.usersRepository.find(stryMutAct_9fa48("53") ? {} : (stryCov_9fa48("53"), {
            select: stryMutAct_9fa48("54") ? [] : (stryCov_9fa48("54"), [stryMutAct_9fa48("55") ? "" : (stryCov_9fa48("55"), 'id'), stryMutAct_9fa48("56") ? "" : (stryCov_9fa48("56"), 'email'), stryMutAct_9fa48("57") ? "" : (stryCov_9fa48("57"), 'name'), stryMutAct_9fa48("58") ? "" : (stryCov_9fa48("58"), 'role'), stryMutAct_9fa48("59") ? "" : (stryCov_9fa48("59"), 'createdAt')])
          }));
        }
      } catch (error) {
        if (stryMutAct_9fa48("60")) {
          {}
        } else {
          stryCov_9fa48("60");
          console.error(stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), 'Error fetching users:'), error);
          throw new InternalServerErrorException(stryMutAct_9fa48("62") ? "" : (stryCov_9fa48("62"), 'Could not fetch users'));
        }
      }
    }
  }
  async login(loginDto: LoginDto): Promise<{
    user: Omit<User, 'password'>;
    token: string;
  }> {
    if (stryMutAct_9fa48("63")) {
      {}
    } else {
      stryCov_9fa48("63");
      // eslint-disable-next-line no-useless-catch
      try {
        if (stryMutAct_9fa48("64")) {
          {}
        } else {
          stryCov_9fa48("64");
          //console.log('Login dto:', loginDto);
          const user = await this.usersRepository.findOne(stryMutAct_9fa48("65") ? {} : (stryCov_9fa48("65"), {
            where: stryMutAct_9fa48("66") ? {} : (stryCov_9fa48("66"), {
              email: loginDto.email
            })
          }));
          //console.log('User found:', user);
          if (stryMutAct_9fa48("69") ? false : stryMutAct_9fa48("68") ? true : stryMutAct_9fa48("67") ? user : (stryCov_9fa48("67", "68", "69"), !user)) {
            if (stryMutAct_9fa48("70")) {
              {}
            } else {
              stryCov_9fa48("70");
              throw new UnauthorizedException(stryMutAct_9fa48("71") ? "" : (stryCov_9fa48("71"), 'Invalid email or password'));
            }
          }
          const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
          if (stryMutAct_9fa48("74") ? false : stryMutAct_9fa48("73") ? true : stryMutAct_9fa48("72") ? isPasswordValid : (stryCov_9fa48("72", "73", "74"), !isPasswordValid)) {
            if (stryMutAct_9fa48("75")) {
              {}
            } else {
              stryCov_9fa48("75");
              throw new UnauthorizedException(stryMutAct_9fa48("76") ? "" : (stryCov_9fa48("76"), 'Invalid email or password'));
            }
          }
          const token = this.jwtService.sign({
            id: user.id,
            email: user.email,
            role: user.role
          } as JwtPayload);
          const {
            password: _password,
            ...userWithoutPassword
          } = user;
          return stryMutAct_9fa48("77") ? {} : (stryCov_9fa48("77"), {
            user: userWithoutPassword,
            token
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("78")) {
          {}
        } else {
          stryCov_9fa48("78");
          //console.error('Login error:', error); 
          throw error;
        }
      }
    }
  }
  async validateUser(payload: JwtPayload): Promise<User | null> {
    if (stryMutAct_9fa48("79")) {
      {}
    } else {
      stryCov_9fa48("79");
      return this.usersRepository.findOne(stryMutAct_9fa48("80") ? {} : (stryCov_9fa48("80"), {
        where: stryMutAct_9fa48("81") ? {} : (stryCov_9fa48("81"), {
          id: payload.id
        })
      }));
    }
  }
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    if (stryMutAct_9fa48("82")) {
      {}
    } else {
      stryCov_9fa48("82");
      const user = await this.usersRepository.findOne(stryMutAct_9fa48("83") ? {} : (stryCov_9fa48("83"), {
        where: stryMutAct_9fa48("84") ? {} : (stryCov_9fa48("84"), {
          id: userId
        })
      }));
      if (stryMutAct_9fa48("87") ? false : stryMutAct_9fa48("86") ? true : stryMutAct_9fa48("85") ? user : (stryCov_9fa48("85", "86", "87"), !user)) {
        if (stryMutAct_9fa48("88")) {
          {}
        } else {
          stryCov_9fa48("88");
          throw new UnauthorizedException(stryMutAct_9fa48("89") ? "" : (stryCov_9fa48("89"), 'User not found'));
        }
      }
      const {
        password: _password,
        ...userWithoutPassword
      } = user;
      return userWithoutPassword;
    }
  }
  async refreshToken(user: JwtPayload): Promise<{
    token: string;
  }> {
    if (stryMutAct_9fa48("90")) {
      {}
    } else {
      stryCov_9fa48("90");
      const token = await this.jwtService.signAsync({
        id: user.id,
        email: user.email,
        role: user.role
      } as JwtPayload);
      return stryMutAct_9fa48("91") ? {} : (stryCov_9fa48("91"), {
        token
      });
    }
  }
  async updateUser(userId: string, UpdateUserDto: UpdateUserDto): Promise<User> {
    if (stryMutAct_9fa48("92")) {
      {}
    } else {
      stryCov_9fa48("92");
      const user = await this.usersRepository.findOne(stryMutAct_9fa48("93") ? {} : (stryCov_9fa48("93"), {
        where: stryMutAct_9fa48("94") ? {} : (stryCov_9fa48("94"), {
          id: userId
        })
      }));
      if (stryMutAct_9fa48("97") ? false : stryMutAct_9fa48("96") ? true : stryMutAct_9fa48("95") ? user : (stryCov_9fa48("95", "96", "97"), !user)) {
        if (stryMutAct_9fa48("98")) {
          {}
        } else {
          stryCov_9fa48("98");
          throw new NotFoundException(stryMutAct_9fa48("99") ? "" : (stryCov_9fa48("99"), 'User not found'));
        }
      }

      // Обновляем только переданные поля
      Object.assign(user, UpdateUserDto);
      return await this.usersRepository.save(user);
    }
  }
}