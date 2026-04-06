'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status-pill';
import { Loader2, ExternalLink, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useClipControllerReviewClip, getClipControllerListCampaignClipsQueryKey } from '@/generated/api/clip/clip';
import { ReviewClipDtoAction } from '@/generated/api/model/reviewClipDtoAction';
import type { ClipResponseDto } from '@/generated/api/model/clipResponseDto';
import { ClipResponseDtoStatus } from '@/generated/api/model/clipResponseDtoStatus';
import { useQueryClient } from '@tanstack/react-query';


const PLATFORM_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  reels: 'Instagram Reels',
  shorts: 'YouTube Shorts',
};

interface ClipReviewCardProps {
  clip: ClipResponseDto;
  isOwner?: boolean;
  campaignId: string;
}

export function ClipReviewCard({ clip, isOwner = false, campaignId }: ClipReviewCardProps) {
  const [pendingAction, setPendingAction] = useState<ReviewClipDtoAction | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState<ReviewClipDtoAction | null>(null);

  const queryClient = useQueryClient();
  const { mutate, isPending } = useClipControllerReviewClip({
    mutation: {
      onSuccess: (_, vars) => {
        const action = vars.data.action;
        const messages: Record<ReviewClipDtoAction, string> = {
          approve: 'Clip berhasil diapprove!',
          reject: 'Clip ditolak.',
          revision: 'Permintaan revisi dikirim.',
        };
        toast.success(messages[action] ?? 'Review berhasil disimpan.');
        setPendingAction(null);
        setShowFeedback(false);
        setFeedback('');
        setFeedbackAction(null);
        queryClient.invalidateQueries({
          queryKey: getClipControllerListCampaignClipsQueryKey(campaignId),
        });
      },
      onError: () => {
        toast.error('Gagal menyimpan review. Coba lagi.');
        setPendingAction(null);
      },
    },
  });

  function handleReview(action: ReviewClipDtoAction, fb?: string) {
    setPendingAction(action);
    mutate({ id: clip.id, data: { action, feedback: fb } });
  }

  function startFeedbackAction(action: ReviewClipDtoAction) {
    setFeedbackAction(action);
    setFeedback('');
    setShowFeedback(true);
  }

  function submitWithFeedback() {
    if (!feedbackAction) return;
    handleReview(feedbackAction, feedback.trim() || undefined);
  }

  const canReview =
    isOwner &&
    (clip.status === ClipResponseDtoStatus.submitted ||
      clip.status === ClipResponseDtoStatus.under_review);

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-medium text-sm">{clip.clipper.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {clip.platform ? PLATFORM_LABEL[clip.platform as unknown as string] ?? (clip.platform as unknown as string) : '—'}
          </p>
        </div>
        <StatusPill status={clip.status} />
      </div>

      {/* URL */}
      {clip.postedUrl && (
        <a
          href={clip.postedUrl as unknown as string}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline truncate"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{clip.postedUrl as unknown as string}</span>
        </a>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          Submitted:{' '}
          {new Date(clip.submittedAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        {clip.reviewedAt && (
          <span>
            Reviewed:{' '}
            {new Date(clip.reviewedAt as unknown as string).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* Review feedback (read) */}
      {clip.reviewFeedback && (
        <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Feedback: </span>
          {clip.reviewFeedback as unknown as string}
        </div>
      )}

      {/* Review actions (owner only) */}
      {canReview && (
        <div className="pt-1 space-y-3">
          {!showFeedback ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                disabled={isPending}
                onClick={() => handleReview(ReviewClipDtoAction.approve)}
              >
                {isPending && pendingAction === ReviewClipDtoAction.approve ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                disabled={isPending}
                onClick={() => startFeedbackAction(ReviewClipDtoAction.revision)}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Minta Revisi
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                disabled={isPending}
                onClick={() => startFeedbackAction(ReviewClipDtoAction.reject)}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Tolak
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                {feedbackAction === ReviewClipDtoAction.reject ? 'Alasan penolakan' : 'Catatan revisi'}{' '}
                <span className="text-muted-foreground font-normal">(opsional)</span>
              </p>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Tulis feedback untuk clipper..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isPending}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={isPending}
                  className={
                    feedbackAction === ReviewClipDtoAction.reject
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }
                  onClick={submitWithFeedback}
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  {feedbackAction === ReviewClipDtoAction.reject ? 'Konfirmasi Tolak' : 'Kirim Revisi'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => {
                    setShowFeedback(false);
                    setFeedbackAction(null);
                    setFeedback('');
                  }}
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
