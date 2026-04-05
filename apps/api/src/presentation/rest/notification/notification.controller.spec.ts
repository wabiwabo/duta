import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { NotificationService } from '../../../domain/notification/notification.service';
import { NotificationQueryDto } from './dto/notification.dto';
import { NotificationType } from '@prisma/client';

const mockUser = {
  id: 'user-1',
  logtoId: 'logto-user-1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'clipper',
};

const mockNotification = {
  id: 'notif-1',
  userId: 'user-1',
  type: NotificationType.clip_approved,
  title: 'Clip Approved',
  body: 'Your clip has been approved.',
  data: null,
  readAt: null,
  createdAt: new Date('2026-01-01'),
};

describe('NotificationController', () => {
  let controller: NotificationController;
  let prismaService: jest.Mocked<PrismaService>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: { findUnique: jest.fn() },
    };
    const mockNotificationService = {
      list: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    prismaService = module.get(PrismaService);
    notificationService = module.get(NotificationService);
  });

  describe('list', () => {
    it('should return notifications list with unread count', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const expected = {
        data: [mockNotification],
        total: 1,
        page: 1,
        unreadCount: 1,
      };
      notificationService.list.mockResolvedValue(expected);

      const query: NotificationQueryDto = { page: 1, limit: 20 };
      const result = await controller.list({ sub: 'logto-user-1' }, query);

      expect(result).toEqual(expected);
      expect(notificationService.list).toHaveBeenCalledWith('user-1', 1, 20);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(controller.list({ sub: 'unknown' }, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      notificationService.markAsRead.mockResolvedValue({ count: 1 });

      const result = await controller.markAsRead('notif-1', { sub: 'logto-user-1' });

      expect(result).toEqual({ updated: 1 });
      expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(controller.markAsRead('notif-1', { sub: 'unknown' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      notificationService.markAllAsRead.mockResolvedValue({ count: 5 });

      const result = await controller.markAllAsRead({ sub: 'logto-user-1' });

      expect(result).toEqual({ updated: 5 });
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('user-1');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(controller.markAllAsRead({ sub: 'unknown' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
