import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('ChatGateway');

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // For MVP: decode JWT payload without full verification
      // In production, use the same JWKS verification as the HTTP guard
      const parts = token.split('.');
      if (parts.length !== 3) {
        client.disconnect();
        return;
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const user = await this.prisma.user.findUnique({ where: { logtoId: payload.sub } });
      if (!user) {
        client.disconnect();
        return;
      }

      (client as any).userId = user.id;

      // Join rooms for existing conversations
      const participations = await this.prisma.conversationParticipant.findMany({
        where: { userId: user.id },
        select: { conversationId: true },
      });
      for (const p of participations) {
        client.join(`conv:${p.conversationId}`);
      }

      this.logger.log(`User ${user.id} connected`);
    } catch (e) {
      this.logger.warn(`Connection failed: ${e}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    // Verify user is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: data.conversationId, userId } },
    });
    if (!participant) return;

    // Save message
    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: userId,
        content: data.content,
      },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Broadcast to conversation room
    this.server.to(`conv:${data.conversationId}`).emit('new_message', message);

    return message;
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    // Verify user is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: data.conversationId, userId } },
    });
    if (!participant) return;

    client.join(`conv:${data.conversationId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client as any).userId;
    client.to(`conv:${data.conversationId}`).emit('user_typing', {
      userId,
      conversationId: data.conversationId,
    });
  }
}
