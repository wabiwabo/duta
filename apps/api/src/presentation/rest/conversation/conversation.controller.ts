import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MessageQueryDto } from './dto/message-query.dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiCreatedResponse({ description: 'Conversation created' })
  async createConversation(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateConversationDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    // Include the creator in participants
    const allParticipantIds = Array.from(new Set([user.id, ...dto.participantIds]));

    const conversation = await this.prisma.conversation.create({
      data: {
        type: dto.type ?? 'direct',
        ...(dto.campaignId && { campaignId: dto.campaignId }),
        participants: {
          create: allParticipantIds.map((uid) => ({ userId: uid })),
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    return conversation;
  }

  @Get()
  @ApiOperation({ summary: 'List my conversations' })
  @ApiOkResponse({ description: 'List of conversations with last message and unread count' })
  async listConversations(@CurrentUser() authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return participations.map((p) => {
      const conv = p.conversation;
      const lastMessage = conv.messages[0] ?? null;

      return {
        id: conv.id,
        type: conv.type,
        campaignId: conv.campaignId,
        createdAt: conv.createdAt,
        participants: conv.participants.map((cp) => cp.user),
        lastMessage,
      };
    });
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation (paginated, newest first)' })
  @ApiOkResponse({ description: 'Paginated messages' })
  async getMessages(
    @CurrentUser() authUser: AuthUser,
    @Param('id') conversationId: string,
    @Query() query: MessageQueryDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    // Check conversation exists
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    // Check user is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) throw new ForbiddenException('Not a participant of this conversation');

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    // Mark unread messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return {
      data: messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
