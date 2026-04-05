import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
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
import { Public } from '../../../shared/decorators/public.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ReviewResponseDto,
  UserReviewsResponseDto,
  PendingReviewDto,
  ReviewAggregateDto,
} from './dto/review-response.dto';

const REVIEW_INCLUDE = {
  reviewer: { select: { id: true, name: true, avatarUrl: true } },
};

function mapReview(r: {
  id: string;
  reviewerId: string;
  revieweeId: string;
  campaignId: string | null;
  clipId: string | null;
  rating: number;
  categories: unknown;
  comment: string | null;
  revealed: boolean;
  createdAt: Date;
  reviewer?: { id: string; name: string; avatarUrl: string | null } | null;
}): ReviewResponseDto {
  return {
    id: r.id,
    reviewerId: r.reviewerId,
    revieweeId: r.revieweeId,
    campaignId: r.campaignId,
    clipId: r.clipId,
    rating: r.rating,
    categories: r.categories,
    comment: r.comment,
    revealed: r.revealed,
    createdAt: r.createdAt,
    reviewer: r.reviewer ?? null,
  };
}

function calculateAggregate(reviews: { rating: number; categories: unknown }[]): ReviewAggregateDto {
  if (reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0, categoryAverages: {} };
  }

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = Math.round((totalRating / reviews.length) * 100) / 100;

  const categoryTotals: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  for (const review of reviews) {
    if (review.categories && typeof review.categories === 'object') {
      const cats = review.categories as Record<string, number>;
      for (const [key, value] of Object.entries(cats)) {
        if (typeof value === 'number') {
          categoryTotals[key] = (categoryTotals[key] ?? 0) + value;
          categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
        }
      }
    }
  }

  const categoryAverages: Record<string, number> = {};
  for (const key of Object.keys(categoryTotals)) {
    categoryAverages[key] = Math.round((categoryTotals[key] / categoryCounts[key]) * 100) / 100;
  }

  return { averageRating, totalReviews: reviews.length, categoryAverages };
}

@ApiTags('Review')
@ApiBearerAuth()
@Controller()
export class ReviewController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('reviews')
  @ApiOperation({ summary: 'Create a review for a campaign counterpart' })
  @ApiCreatedResponse({ type: ReviewResponseDto })
  async createReview(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    if (user.id === dto.revieweeId) {
      throw new BadRequestException('You cannot review yourself');
    }

    const reviewee = await this.prisma.user.findUnique({ where: { id: dto.revieweeId } });
    if (!reviewee) throw new NotFoundException('Reviewee not found');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: dto.campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Verify completed transaction between reviewer and reviewee on this campaign
    const completedTransaction = await this.prisma.transaction.findFirst({
      where: {
        campaignId: dto.campaignId,
        status: 'completed',
        OR: [
          { fromUserId: user.id, toUserId: dto.revieweeId },
          { fromUserId: dto.revieweeId, toUserId: user.id },
        ],
      },
    });

    if (!completedTransaction) {
      throw new ForbiddenException(
        'You can only review someone you have completed a transaction with on this campaign',
      );
    }

    // Can't review same person for same campaign twice
    const existingReview = await this.prisma.review.findFirst({
      where: {
        reviewerId: user.id,
        revieweeId: dto.revieweeId,
        campaignId: dto.campaignId,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this person for this campaign');
    }

    const review = await this.prisma.review.create({
      data: {
        reviewerId: user.id,
        revieweeId: dto.revieweeId,
        campaignId: dto.campaignId,
        clipId: dto.clipId ?? null,
        rating: dto.rating,
        categories: dto.categories ? (dto.categories as object) : undefined,
        comment: dto.comment ?? null,
        revealed: false,
      },
      include: REVIEW_INCLUDE,
    });

    return mapReview(review as Parameters<typeof mapReview>[0]);
  }

  @Get('reviews/pending')
  @ApiOperation({ summary: 'List campaigns where user can leave a pending review' })
  @ApiOkResponse({ type: [PendingReviewDto] })
  async getPendingReviews(
    @CurrentUser() authUser: AuthUser,
  ): Promise<PendingReviewDto[]> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    // Find all completed transactions involving this user
    const completedTransactions = await this.prisma.transaction.findMany({
      where: {
        status: 'completed',
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
        campaignId: { not: null },
      },
      include: {
        campaign: { select: { id: true, title: true } },
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    // Find reviews already written by this user
    const writtenReviews = await this.prisma.review.findMany({
      where: { reviewerId: user.id },
      select: { campaignId: true, revieweeId: true },
    });

    const writtenSet = new Set(
      writtenReviews.map((r) => `${r.campaignId}:${r.revieweeId}`),
    );

    const pending: PendingReviewDto[] = [];
    const seen = new Set<string>();

    for (const tx of completedTransactions) {
      if (!tx.campaignId || !tx.campaign) continue;

      const counterpartId =
        tx.fromUserId === user.id ? tx.toUserId : tx.fromUserId;
      const counterpart =
        tx.fromUserId === user.id ? tx.toUser : tx.fromUser;

      if (!counterpartId || !counterpart) continue;

      const key = `${tx.campaignId}:${counterpartId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (!writtenSet.has(key)) {
        pending.push({
          campaignId: tx.campaignId,
          campaignTitle: tx.campaign.title,
          revieweeId: counterpartId,
          revieweeName: counterpart.name,
        });
      }
    }

    return pending;
  }

  @Public()
  @Get('users/:id/reviews')
  @ApiOperation({ summary: 'Get reviews for a user with aggregates (public, only mutually revealed)' })
  @ApiOkResponse({ type: UserReviewsResponseDto })
  async getUserReviews(
    @Param('id') userId: string,
  ): Promise<UserReviewsResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Fetch all reviews for this user where both this review AND the counterpart are revealed
    // A review is "mutually revealed" when both sides have set revealed=true
    const reviews = await this.prisma.review.findMany({
      where: {
        revieweeId: userId,
        revealed: true,
      },
      orderBy: { createdAt: 'desc' },
      include: REVIEW_INCLUDE,
    });

    // Filter to only reviews where the counterpart review is also revealed (mutual reveal)
    const mutuallyRevealedReviews = await Promise.all(
      reviews.map(async (r) => {
        if (!r.campaignId) return r; // if no campaign, just show if revealed
        const counterpart = await this.prisma.review.findFirst({
          where: {
            reviewerId: r.revieweeId,
            revieweeId: r.reviewerId,
            campaignId: r.campaignId,
            revealed: true,
          },
        });
        return counterpart ? r : null;
      }),
    );

    const visibleReviews = mutuallyRevealedReviews.filter(
      (r): r is NonNullable<typeof r> => r !== null,
    );

    const data = visibleReviews.map((r) => mapReview(r as Parameters<typeof mapReview>[0]));
    const aggregate = calculateAggregate(visibleReviews);

    return { data, aggregate };
  }

  @Post('reviews/:id/reveal')
  @ApiOperation({ summary: 'Reveal a review (Airbnb-style mutual reveal)' })
  @ApiOkResponse({ type: ReviewResponseDto })
  async revealReview(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<ReviewResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const review = await this.prisma.review.findUnique({
      where: { id },
      include: REVIEW_INCLUDE,
    });

    if (!review) throw new NotFoundException('Review not found');

    // Only the reviewer can reveal their own review
    if (review.reviewerId !== user.id) {
      throw new ForbiddenException('Only the reviewer can reveal their own review');
    }

    if (review.revealed) {
      throw new BadRequestException('Review is already revealed');
    }

    // Mark this review as ready to reveal
    const updated = await this.prisma.review.update({
      where: { id },
      data: { revealed: true },
      include: REVIEW_INCLUDE,
    });

    // Check if counterpart review exists and is also revealed
    // If so, both are now mutually revealed (no extra action needed — getUserReviews handles the filtering)
    if (review.campaignId) {
      const counterpart = await this.prisma.review.findFirst({
        where: {
          reviewerId: review.revieweeId,
          revieweeId: review.reviewerId,
          campaignId: review.campaignId,
          revealed: true,
        },
      });

      // Both reviews are now revealed — they will appear in public listings
      // (The mutual reveal check in getUserReviews handles visibility)
      if (counterpart) {
        // Both sides revealed — mutual reveal complete
      }
    }

    return mapReview(updated as Parameters<typeof mapReview>[0]);
  }
}
