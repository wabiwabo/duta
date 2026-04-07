import { cn } from '@/lib/utils';

const statusConfig: Record<string, { bg: string; text: string; glow: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-400', glow: 'shadow-[0_0_8px_var(--color-success-glow)]' },
  approved: { bg: 'bg-green-500/10', text: 'text-green-400', glow: 'shadow-[0_0_8px_var(--color-success-glow)]' },
  completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-[0_0_8px_var(--color-info-glow)]' },
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', glow: '' },
  paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: 'shadow-[0_0_8px_var(--color-warning-glow)]' },
  submitted: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-[0_0_8px_var(--color-info-glow)]' },
  under_review: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: 'shadow-[0_0_8px_var(--color-warning-glow)]' },
  revision: { bg: 'bg-orange-500/10', text: 'text-orange-400', glow: 'shadow-[0_0_8px_var(--color-warning-glow)]' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', glow: 'shadow-[0_0_8px_var(--color-error-glow)]' },
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: 'shadow-[0_0_8px_var(--color-warning-glow)]' },
  processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-[0_0_8px_var(--color-info-glow)]' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', glow: 'shadow-[0_0_8px_var(--color-error-glow)]' },
  open: { bg: 'bg-red-500/10', text: 'text-red-400', glow: 'shadow-[0_0_8px_var(--color-error-glow)]' },
  resolved: { bg: 'bg-green-500/10', text: 'text-green-400', glow: 'shadow-[0_0_8px_var(--color-success-glow)]' },
};

interface StatusPillProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        config.glow,
        className,
      )}
    >
      {label || status.replace(/_/g, ' ')}
    </span>
  );
}
