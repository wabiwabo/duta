import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import { ScheduledPost } from '@prisma/client';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Schedule a clip to be posted on a platform at a given time.
   */
  async schedulePost(
    userId: string,
    dto: { clipId: string; platform: string; scheduledAt: Date },
  ): Promise<ScheduledPost> {
    if (dto.scheduledAt <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    // Verify the clip belongs to the user
    const clip = await this.prisma.clip.findUnique({
      where: { id: dto.clipId },
      select: { id: true, clipperId: true },
    });
    if (!clip) throw new NotFoundException('Clip not found');
    if (clip.clipperId !== userId) {
      throw new ForbiddenException('You do not own this clip');
    }

    return this.prisma.scheduledPost.create({
      data: {
        clipId: dto.clipId,
        userId,
        platform: dto.platform,
        scheduledAt: dto.scheduledAt,
        status: 'pending',
      },
    });
  }

  /**
   * Cancel a scheduled post (must be owned by the user and still pending).
   */
  async cancelPost(userId: string, postId: string): Promise<void> {
    const post = await this.prisma.scheduledPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Scheduled post not found');
    if (post.userId !== userId) throw new ForbiddenException('Access denied');
    if (post.status !== 'pending') {
      throw new BadRequestException('Only pending posts can be cancelled');
    }

    await this.prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'cancelled' },
    });
  }

  /**
   * Get all scheduled posts for a user.
   */
  async listScheduled(userId: string): Promise<ScheduledPost[]> {
    return this.prisma.scheduledPost.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Process all due pending posts. Marks them as published.
   * In production this would call the actual platform APIs.
   * @returns number of posts processed
   */
  async processDuePosts(): Promise<number> {
    const now = new Date();
    const duePosts = await this.prisma.scheduledPost.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: now },
      },
    });

    if (duePosts.length === 0) return 0;

    let processed = 0;
    for (const post of duePosts) {
      try {
        // Placeholder: mark as published (real implementation would call platform API)
        await this.prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
          },
        });
        processed++;
      } catch (err) {
        this.logger.error(`Failed to process scheduled post ${post.id}`, err);
        await this.prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'failed',
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    this.logger.log(`Processed ${processed}/${duePosts.length} scheduled posts`);
    return processed;
  }

  /**
   * Cron job: process due posts every 5 minutes.
   */
  @Cron('*/5 * * * *')
  async handleCron() {
    this.logger.debug('Running scheduled posts cron');
    await this.processDuePosts();
  }
}
