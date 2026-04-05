import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { CreateConversationDto, ConversationTypeEnum } from './dto/create-conversation.dto';

const mockUser = {
  id: 'user-1',
  logtoId: 'logto-sub-1',
  email: 'alice@example.com',
  name: 'Alice',
  avatarUrl: null,
};

const mockConversation = {
  id: 'conv-1',
  type: 'direct',
  campaignId: null,
  createdAt: new Date('2026-01-01'),
  participants: [
    { user: { id: 'user-1', name: 'Alice', avatarUrl: null } },
    { user: { id: 'user-2', name: 'Bob', avatarUrl: null } },
  ],
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  conversation: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  conversationParticipant: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('ConversationController', () => {
  let controller: ConversationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<ConversationController>(ConversationController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createConversation', () => {
    const createDto: CreateConversationDto = {
      participantIds: ['user-2'],
      type: ConversationTypeEnum.direct,
    };

    it('should create a conversation and include creator as participant', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.create.mockResolvedValue(mockConversation);

      const result = await controller.createConversation({ sub: 'logto-sub-1' }, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('conv-1');
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'direct',
            participants: {
              create: expect.arrayContaining([
                { userId: 'user-1' },
                { userId: 'user-2' },
              ]),
            },
          }),
        }),
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.createConversation({ sub: 'unknown' }, createDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should deduplicate participantIds when creator is also in list', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.create.mockResolvedValue(mockConversation);

      const dtoWithSelf: CreateConversationDto = {
        participantIds: ['user-1', 'user-2'],
        type: ConversationTypeEnum.direct,
      };

      await controller.createConversation({ sub: 'logto-sub-1' }, dtoWithSelf);

      const createCall = mockPrisma.conversation.create.mock.calls[0][0];
      const participantCreates = createCall.data.participants.create;
      const userIds = participantCreates.map((p: any) => p.userId);
      // user-1 should appear only once
      expect(userIds.filter((id: string) => id === 'user-1').length).toBe(1);
    });
  });

  describe('listConversations', () => {
    it('should return conversations with last message preview', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([
        {
          conversation: {
            ...mockConversation,
            messages: [
              {
                id: 'msg-1',
                content: 'Hello',
                createdAt: new Date(),
                sender: { id: 'user-2', name: 'Bob', avatarUrl: null },
              },
            ],
          },
        },
      ]);

      const result = await controller.listConversations({ sub: 'logto-sub-1' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('conv-1');
      expect(result[0].lastMessage).not.toBeNull();
      expect(result[0].lastMessage.content).toBe('Hello');
    });

    it('should return null lastMessage when no messages', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([
        {
          conversation: {
            ...mockConversation,
            messages: [],
          },
        },
      ]);

      const result = await controller.listConversations({ sub: 'logto-sub-1' });

      expect(result[0].lastMessage).toBeNull();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.listConversations({ sub: 'unknown' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMessages', () => {
    it('should return paginated messages and mark as read', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrisma.message.findMany.mockResolvedValue([
        {
          id: 'msg-1',
          content: 'Hello',
          createdAt: new Date(),
          sender: { id: 'user-2', name: 'Bob', avatarUrl: null },
        },
      ]);
      mockPrisma.message.count.mockResolvedValue(1);
      mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });

      const result = await controller.getMessages(
        { sub: 'logto-sub-1' },
        'conv-1',
        { page: 1, limit: 50 },
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.message.updateMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      await expect(
        controller.getMessages({ sub: 'logto-sub-1' }, 'non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a participant', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        controller.getMessages({ sub: 'logto-sub-1' }, 'conv-1', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.getMessages({ sub: 'unknown' }, 'conv-1', {}),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
