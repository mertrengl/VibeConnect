import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  providers: [ConversationsService],
  controllers: [ConversationsController],
  imports: [PrismaModule, CloudinaryModule],
  exports: [ConversationsService],
})
export class ConversationsModule {}
