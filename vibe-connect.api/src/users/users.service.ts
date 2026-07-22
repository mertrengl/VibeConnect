import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { UpdateProfileDto } from './dtos/update_profile.dto';
import { ChangePasswordDto } from './dtos/change_password.dto';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async searchUsers(query: string, currentUserId: string) {
    return await this.prisma.users.findMany({
      where: {
        id: { not: currentUserId },
        username: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        username: true,
      },
      take: 20,
    });
  }

  async getMe(userId: string) {
    return await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async getUserById(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        created_at: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    return user;
  }

  async updateUserProfile(userId: string, dto: UpdateProfileDto) {
    try {
      return await this.prisma.users.update({
        where: { id: userId },
        data: {
          username: dto.username,
          email: dto.email,
        },
        select: {
          id: true,
          username: true,
          email: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Kullanıcı adı veya e-posta zaten kullanımda.',
        );
      }
      throw error;
    }
  }

  async changeUserPassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { password_hash: true },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Eski şifre yanlış.');
    }
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password_hash: hashedPassword },
    });

    return { message: 'Şifre başarıyla değiştirildi.' };
  }
  async updateAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Dosya bulunamadı.');
    }
    const uploadResult = await this.cloudinaryService.uploadImage(file);
    const imageUrl = (uploadResult.secure_url || uploadResult.url) as string;

    return await this.prisma.users.update({
      where: { id: userId },
      data: { avatar_url: imageUrl },
      select: {
        id: true,
        username: true,
        email: true,
        avatar_url: true,
      },
    });
  }

  async removeAvatar(userId: string) {
    return await this.prisma.users.update({
      where: { id: userId },
      data: { avatar_url: null },
      select: {
        id: true,
        username: true,
        email: true,
        avatar_url: true,
      },
    });
  }
}
