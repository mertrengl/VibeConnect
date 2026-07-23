import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  providers: [MessagesService, MessagesGateway],
  controllers: [MessagesController],
  imports: [PrismaModule, AuthModule, CloudinaryModule],
})
export class MessagesModule {}
