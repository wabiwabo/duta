import { Injectable } from '@nestjs/common';
import { ClipperTier } from '@prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';

@Injectable()
export class ClipperScoringService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateScore(userId: string): Promise<{ score: number; tier: ClipperTier }> {
    // Get all approved clips by this user
    const clips = await this.prisma.clip.findMany({
      where: { clipperId: userId, status: 'approved' },
      include: { campaign: true },
    });

    if (clips.length === 0) return { score: 0, tier: ClipperTier.bronze };

    // Views component (30%): normalized total verified views
    const totalViews = clips.reduce((sum, c) => sum + c.viewsVerified, 0);
    const viewsScore = Math.min(100, totalViews / 100); // 10K views = 100

    // Approval rate (25%): approved / total submitted
    const totalSubmitted = await this.prisma.clip.count({ where: { clipperId: userId } });
    const approvalRate = (clips.length / totalSubmitted) * 100;

    // Creator ratings (25%): average rating received
    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: userId },
      select: { rating: true },
    });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 3; // default 3/5
    const ratingScore = (avgRating / 5) * 100;

    // Consistency (20%): active in last 4 weeks
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const recentClips = clips.filter((c) => c.createdAt >= fourWeeksAgo).length;
    const consistencyScore = Math.min(100, recentClips * 20); // 5+ clips = 100

    // Weighted score
    const score = Math.round(
      viewsScore * 0.3 +
        approvalRate * 0.25 +
        ratingScore * 0.25 +
        consistencyScore * 0.2,
    );

    const clampedScore = Math.max(0, Math.min(100, score));
    const tier = this.getTier(clampedScore);

    return { score: clampedScore, tier };
  }

  getTier(score: number): ClipperTier {
    if (score >= 90) return ClipperTier.platinum;
    if (score >= 70) return ClipperTier.gold;
    if (score >= 40) return ClipperTier.silver;
    return ClipperTier.bronze;
  }

  async recalculateAll(): Promise<number> {
    const clippers = await this.prisma.user.findMany({
      where: { role: 'clipper' },
      select: { id: true },
    });

    let updated = 0;
    for (const clipper of clippers) {
      const { score, tier } = await this.calculateScore(clipper.id);
      await this.prisma.user.update({
        where: { id: clipper.id },
        data: { clipperScore: score, clipperTier: tier },
      });
      updated++;
    }
    return updated;
  }
}
