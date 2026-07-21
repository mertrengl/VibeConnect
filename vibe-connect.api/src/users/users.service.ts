import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
}
