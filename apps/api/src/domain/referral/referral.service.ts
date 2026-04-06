import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import { Referral } from '@prisma/client';
import * as crypto from 'crypto';

const REFERRAL_BONUS_AMOUNT = 25000; // Rp 25,000

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique 8-char alphanumeric referral code for a user.
   * Idempotent: returns existing code if already generated.
   */
  async generateCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true },
    });
    if (!user) throw new BadRequestException('User not found');
    if (user.referralCode) return user.referralCode;

    // Generate 8-char code from userId hash + random
    let code: string;
    let attempts = 0;
    do {
      const hash = crypto
        .createHash('sha256')
        .update(userId + attempts + Math.random().toString())
        .digest('hex');
      code = hash.slice(0, 8).toUpperCase();
      attempts++;
    } while (await this.prisma.user.findUnique({ where: { referralCode: code } }));

    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });

    return code;
  }

  /**
   * Apply a referral code when a new user signs up.
   * A user can only be referred once.
   */
  async applyReferral(refereeId: string, code: string): Promise<void> {
    // Check referee hasn't already been referred
    const existingReferral = await this.prisma.referral.findUnique({
      where: { refereeId },
    });
    if (existingReferral) {
      throw new ConflictException('You have already used a referral code');
    }

    // Find referrer by code
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!referrer) {
      throw new BadRequestException('Invalid referral code');
    }

    if (referrer.id === refereeId) {
      throw new BadRequestException('You cannot use your own referral code');
    }

    await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId,
        code,
        bonusAmount: REFERRAL_BONUS_AMOUNT,
      },
    });
  }

  /**
   * Get referral stats for a user.
   */
  async getStats(
    userId: string,
  ): Promise<{ totalReferred: number; totalBonus: number; referrals: Referral[] }> {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalBonus = referrals
      .filter((r) => r.bonusPaid)
      .reduce((sum, r) => sum + r.bonusAmount, 0);

    return {
      totalReferred: referrals.length,
      totalBonus,
      referrals,
    };
  }

  /**
   * Check if referee has completed their first clip or campaign, and if so pay the bonus.
   * Called after a clip is submitted or a campaign is created.
   */
  async checkAndPayBonus(refereeId: string): Promise<void> {
    const referral = await this.prisma.referral.findUnique({
      where: { refereeId },
    });
    if (!referral || referral.bonusPaid) return;

    // Check if referee has at least one clip or one campaign
    const [clipCount, campaignCount] = await Promise.all([
      this.prisma.clip.count({ where: { clipperId: refereeId } }),
      this.prisma.campaign.count({ where: { ownerId: refereeId } }),
    ]);

    if (clipCount >= 1 || campaignCount >= 1) {
      await this.prisma.referral.update({
        where: { id: referral.id },
        data: { bonusPaid: true },
      });

      // Record bonus transaction for referrer
      await this.prisma.transaction.create({
        data: {
          type: 'deposit',
          toUserId: referral.referrerId,
          amount: referral.bonusAmount,
          currency: 'IDR',
          status: 'completed',
          paymentMethod: 'referral_bonus',
          paymentReference: `referral_${referral.id}`,
        },
      });
    }
  }
}
