import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { ClipperScoringService } from '../../../domain/clipper/clipper-scoring.service';
import { AdminGuard } from '../../../shared/guards/admin.guard';
import { Public } from '../../../shared/decorators/public.decorator';
import {
  ClipperScoreDto,
  LeaderboardResponseDto,
  RecalculateResponseDto,
} from './dto/clipper.dto';

@ApiTags('Clipper')
@Controller()
export class ClipperController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clipperScoringService: ClipperScoringService,
  ) {}

  @Public()
  @Get('clippers/:id/score')
  @ApiOperation({ summary: 'Get clipper score and tier (public)' })
  @ApiOkResponse({ type: ClipperScoreDto })
  async getClipperScore(@Param('id') id: string): Promise<ClipperScoreDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, clipperScore: true, clipperTier: true },
    });

    if (!user) throw new NotFoundException('Clipper not found');
    if (user.role !== 'clipper') throw new NotFoundException('Clipper not found');

    return {
      userId: user.id,
      score: user.clipperScore,
      tier: user.clipperTier,
    };
  }

  @Public()
  @Get('clippers/leaderboard')
  @ApiOperation({ summary: 'Get top 20 clippers by score (public)' })
  @ApiOkResponse({ type: LeaderboardResponseDto })
  async getLeaderboard(): Promise<LeaderboardResponseDto> {
    const clippers = await this.prisma.user.findMany({
      where: { role: 'clipper' },
      orderBy: { clipperScore: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        clipperScore: true,
        clipperTier: true,
      },
    });

    return {
      data: clippers.map((c) => ({
        id: c.id,
        name: c.name,
        avatarUrl: c.avatarUrl,
        clipperScore: c.clipperScore,
        clipperTier: c.clipperTier,
      })),
    };
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post('admin/recalculate-scores')
  @ApiOperation({ summary: 'Trigger recalculation of all clipper scores (admin only)' })
  @ApiOkResponse({ type: RecalculateResponseDto })
  async recalculateScores(): Promise<RecalculateResponseDto> {
    const updated = await this.clipperScoringService.recalculateAll();
    return { updated };
  }
}
