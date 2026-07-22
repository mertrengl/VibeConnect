import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  providers: [UsersService],
  controllers: [UsersController],
  imports: [PrismaModule, CloudinaryModule],
})
export class UsersModule {}
