'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, TrendingUp, Wallet } from 'lucide-react';
import type { CampaignResponseDto } from '@/generated/api/model';

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  bounty: 'default',
  gig: 'secondary',
  podcast: 'outline',
};

interface CampaignCardProps {
  campaign: CampaignResponseDto;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const {
    id,
    title,
    type,
    ratePerKViews,
    budgetTotal,
    budgetRemaining,
    targetPlatforms,
    owner,
    clipCount,
    status,
    deadline,
    createdAt,
  } = campaign;

  const budgetPercent = budgetTotal > 0 ? Math.round(((budgetTotal - budgetRemaining) / budgetTotal) * 100) : 0;

  return (
    <Link href={`/campaigns/${id}`} className="block group">
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            <Badge variant={typeBadgeVariant[type] ?? 'secondary'} className="shrink-0 capitalize">
              {type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">by {owner.name}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Rate */}
          {ratePerKViews != null && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-primary">{formatRupiah(ratePerKViews as unknown as number)}</span>
              <span className="text-muted-foreground">/ 1K views</span>
            </div>
          )}

          {/* Budget */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 shrink-0" />
                <span>Budget tersisa</span>
              </div>
              <span className="font-medium text-foreground">{formatRupiah(budgetRemaining)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{budgetPercent}% terpakai</p>
          </div>

          {/* Platforms */}
          {targetPlatforms.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {targetPlatforms.map((platform) => (
                <Badge key={platform} variant="outline" className="text-xs capitalize px-1.5 py-0">
                  {platform}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>{clipCount} clips</span>
            </div>
            {deadline ? (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{new Date(deadline as unknown as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            ) : (
              <span className="italic">Tidak ada deadline</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
