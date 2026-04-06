import { cn } from '@/lib/utils';

const tierConfig: Record<string, { bg: string; text: string; shimmer: boolean }> = {
  bronze: { bg: 'bg-orange-900/20', text: 'text-orange-400', shimmer: false },
  silver: { bg: 'bg-gray-400/20', text: 'text-gray-300', shimmer: false },
  gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', shimmer: true },
  platinum: { bg: 'bg-purple-400/20', text: 'text-purple-300', shimmer: true },
};

interface ShimmerBadgeProps {
  tier: string;
  className?: string;
}

export function ShimmerBadge({ tier, className }: ShimmerBadgeProps) {
  const config = tierConfig[tier] || tierConfig.bronze;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
        config.bg,
        config.text,
        config.shimmer && 'shimmer',
        className,
      )}
    >
      {tier}
    </span>
  );
}
