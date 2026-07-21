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

type userPresence = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY';

interface PresenceStatus {
  socketId: string;
  status: userPresence;
}
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

  private activeUsers: Map<string, PresenceStatus> = new Map();

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

      this.activeUsers.set(payload.sub, {
        socketId: client.id,
        status: 'ONLINE',
      });

      this.server.emit('userOnline', { userId: payload.sub, status: 'ONLINE' });

      const onlineUsersList = Array.from(this.activeUsers.entries()).map(
        ([id, val]) => ({
          userId: id,
          status: val.status,
        }),
      );
      client.emit('onlineUsersList', onlineUsersList);

      console.log(
        `İstemci bağlandı: ${client.id}, Kullanıcı ID: ${client.data.sub}`,
      );
    } catch (error) {
      console.error('Bağlantı hatası:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.sub;

    if (userId) {
      this.activeUsers.delete(userId);
      this.server.emit('userOffline', { userId });
    }

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
  @SubscribeMessage('updateStatus')
  handleUpdateStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { status: userPresence },
  ) {
    const userId = client.data.sub;
    const currentUserPresence = this.activeUsers.get(userId);

    if (currentUserPresence) {
      currentUserPresence.status = payload.status;
      this.activeUsers.set(userId, currentUserPresence);
      this.server.emit('userStatusUpdated', {
        userId,
        status: payload.status,
      });
    }
  }
}
