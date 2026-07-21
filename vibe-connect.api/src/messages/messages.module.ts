import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [MessagesService, MessagesGateway],
  controllers: [MessagesController],
  imports: [PrismaModule, AuthModule],
})
export class MessagesModule {}
