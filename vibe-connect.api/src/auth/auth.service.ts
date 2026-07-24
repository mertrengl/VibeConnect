import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

import { ErrorCodes } from '../common/constants/error_codes';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    const existingUser = await this.prisma.users.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new ConflictException({
        code: ErrorCodes.USER_ALREADY_EXISTS,
        message: 'Kullanıcı adı veya email zaten mevcut.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = await this.prisma.users.create({
        data: {
          username,
          email,
          password_hash: hashedPassword,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: ErrorCodes.USER_ALREADY_EXISTS,
          message: 'Kullanıcı adı veya email zaten mevcut.',
        });
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { usernameOrEmail, password, rememberMe } = loginDto;

    const user = await this.prisma.users.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Geçersiz kullanıcı bilgisi veya şifre girdiniz.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Geçersiz kullanıcı bilgisi veya şifre girdiniz.',
      });
    }

    const payload = { sub: user.id, username: user.username };

    const tokenExpiration = rememberMe ? '180d' : '1d';

    return {
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: tokenExpiration,
      }),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }
}
