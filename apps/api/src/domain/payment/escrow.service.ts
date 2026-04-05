import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import { XenditService } from '../../infrastructure/payment/xendit.service';

const PLATFORM_FEE_RATES: Record<string, number> = {
  bounty: 0.10,
  gig: 0.12,
  podcast: 0.08,
};

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xendit: XenditService,
  ) {}

  /**
   * Create a deposit invoice for a campaign.
   * Finds or creates the EscrowAccount, creates Xendit invoice, and records a pending Transaction.
   */
  async deposit(
    campaignId: string,
    amount: number,
    userId: string,
  ): Promise<{ invoiceUrl: string; transactionId: string }> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { owner: { select: { id: true, email: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Find or create escrow account
    let escrow = await this.prisma.escrowAccount.findUnique({ where: { campaignId } });
    if (!escrow) {
      escrow = await this.prisma.escrowAccount.create({
        data: { campaignId, status: 'active' },
      });
    }

    const externalId = `deposit-${campaignId}-${Date.now()}`;

    // Create Xendit invoice
    const { invoiceUrl } = await this.xendit.createInvoice({
      externalId,
      amount,
      payerEmail: campaign.owner.email,
      description: `Deposit for campaign: ${campaign.title}`,
    });

    // Record pending transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        type: 'deposit',
        fromUserId: userId,
        campaignId,
        amount,
        currency: 'IDR',
        status: 'pending',
        paymentReference: externalId,
      },
    });

    this.logger.log(`Deposit invoice created: externalId=${externalId} amount=${amount}`);
    return { invoiceUrl, transactionId: transaction.id };
  }

  /**
   * Calculate and record earnings for an approved clip.
   * Creates payout + fee transactions, updates escrow balances, updates clip.earningsAmount.
   * Auto-pauses campaign if 80% of budget is spent.
   */
  async releaseForClip(clipId: string): Promise<void> {
    const clip = await this.prisma.clip.findUnique({
      where: { id: clipId },
      include: {
        campaign: true,
      },
    });
    if (!clip) throw new NotFoundException('Clip not found');
    if (clip.viewsVerified <= 0) {
      throw new BadRequestException('Clip has no verified views — cannot release earnings');
    }

    const campaign = clip.campaign;
    if (!campaign.ratePerKViews) {
      throw new BadRequestException('Campaign has no ratePerKViews set');
    }

    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { campaignId: campaign.id },
    });
    if (!escrow) throw new NotFoundException('Escrow account not found for campaign');

    // Calculate earnings
    const earnings = Math.floor((clip.viewsVerified * campaign.ratePerKViews) / 1000);
    const feeRate = PLATFORM_FEE_RATES[campaign.type] ?? 0.10;
    const fee = Math.floor(earnings * feeRate);
    const netPayout = earnings - fee;

    this.logger.log(
      `releaseForClip: clipId=${clipId} views=${clip.viewsVerified} earnings=${earnings} fee=${fee} net=${netPayout}`,
    );

    // Update escrow balances
    await this.prisma.escrowAccount.update({
      where: { campaignId: campaign.id },
      data: {
        totalReleased: { increment: earnings },
        balance: { decrement: earnings },
      },
    });

    // Create payout transaction (to clipper)
    await this.prisma.transaction.create({
      data: {
        type: 'payout',
        toUserId: clip.clipperId,
        campaignId: campaign.id,
        clipId: clip.id,
        amount: netPayout,
        currency: 'IDR',
        status: 'pending',
        paymentReference: `payout-${clip.id}-${Date.now()}`,
      },
    });

    // Create fee transaction (to platform)
    await this.prisma.transaction.create({
      data: {
        type: 'fee',
        fromUserId: clip.clipperId,
        campaignId: campaign.id,
        clipId: clip.id,
        amount: fee,
        currency: 'IDR',
        status: 'completed',
        paymentReference: `fee-${clip.id}-${Date.now()}`,
      },
    });

    // Update clip earningsAmount
    await this.prisma.clip.update({
      where: { id: clipId },
      data: { earningsAmount: netPayout },
    });

    // Update campaign budgetSpent and check 80% threshold
    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { budgetSpent: { increment: earnings } },
    });

    const spentRatio = updatedCampaign.budgetSpent / updatedCampaign.budgetTotal;
    if (spentRatio >= 0.8 && updatedCampaign.status === 'active') {
      this.logger.log(
        `Campaign ${campaign.id} reached 80% budget (${updatedCampaign.budgetSpent}/${updatedCampaign.budgetTotal}) — auto-pausing`,
      );
      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'paused' },
      });
    }
  }

  /**
   * Refund remaining escrow balance to campaign owner.
   */
  async refund(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { owner: { select: { id: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const escrow = await this.prisma.escrowAccount.findUnique({ where: { campaignId } });
    if (!escrow) throw new NotFoundException('Escrow account not found');
    if (escrow.balance <= 0) throw new BadRequestException('No balance to refund');

    const refundAmount = escrow.balance;

    await this.prisma.escrowAccount.update({
      where: { campaignId },
      data: {
        totalRefunded: { increment: refundAmount },
        balance: 0,
        status: 'refunded',
      },
    });

    await this.prisma.transaction.create({
      data: {
        type: 'refund',
        toUserId: campaign.owner.id,
        campaignId,
        amount: refundAmount,
        currency: 'IDR',
        status: 'completed',
        paymentReference: `refund-${campaignId}-${Date.now()}`,
      },
    });

    this.logger.log(`Refund processed: campaignId=${campaignId} amount=${refundAmount}`);
  }

  /**
   * Called from webhook when Xendit invoice is paid.
   * Idempotent — skips if transaction already completed.
   */
  async onDepositPaid(externalId: string, amount: number): Promise<void> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { paymentReference: externalId, type: 'deposit' },
    });

    if (!transaction) {
      this.logger.warn(`onDepositPaid: no pending deposit transaction found for externalId=${externalId}`);
      return;
    }

    // Idempotency check
    if (transaction.status === 'completed') {
      this.logger.warn(`onDepositPaid: transaction ${transaction.id} already completed — skipping`);
      return;
    }

    // Mark transaction as completed
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'completed' },
    });

    // Update escrow balance
    await this.prisma.escrowAccount.update({
      where: { campaignId: transaction.campaignId! },
      data: {
        totalDeposited: { increment: amount },
        balance: { increment: amount },
      },
    });

    // Auto-activate campaign if it's in draft
    if (transaction.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: transaction.campaignId },
      });
      if (campaign?.status === 'draft') {
        await this.prisma.campaign.update({
          where: { id: transaction.campaignId },
          data: { status: 'active' },
        });
        this.logger.log(`Campaign ${transaction.campaignId} auto-activated after deposit`);
      }
    }

    this.logger.log(`Deposit completed: externalId=${externalId} amount=${amount}`);
  }

  /**
   * Get the escrow account for a campaign.
   */
  async getEscrow(campaignId: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({ where: { campaignId } });
    if (!escrow) throw new NotFoundException('Escrow account not found');
    return escrow;
  }
}
