import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  sub: string;
}

interface AuthenticatedSocket extends Socket {
  data: {
    sub: string;
  };
}

interface RoomPayload {
  conversationId: string;
}

interface SendMessagePayload {
  conversationId: string;
  content: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const authHeader = client.handshake.headers['authorization'];
      const token =
        (client.handshake.auth.token as string) ||
        (typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data = { sub: payload.sub };

      console.log(
        `İstemci bağlandı: ${client.id}, Kullanıcı ID: ${client.data.sub}`,
      );
    } catch (error) {
      console.error('Bağlantı hatası:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`İstemci bağlantısı kesildi: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown,
  ) {
    console.log(`İstemci tarafından ping alındı: ${client.id}:`, data);
    client.emit('pong', { message: 'Socket Aktif' });
  }
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: RoomPayload,
  ) {
    await client.join(payload.conversationId);
  }
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: RoomPayload,
  ) {
    await client.leave(payload.conversationId);
  }
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: RoomPayload,
  ) {
    client.to(payload.conversationId).emit('typing', {
      userId: client.data.sub,
      conversationId: payload.conversationId,
    });
  }
  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: RoomPayload,
  ) {
    client.to(payload.conversationId).emit('userStoppedTyping', {
      userId: client.data.sub,
      conversationId: payload.conversationId,
    });
  }
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const message = await this.messagesService.createMessage(
      { conversationId: payload.conversationId, content: payload.content },
      client.data.sub,
    );
    this.server.to(payload.conversationId).emit('newMessage', message);
  }
}
