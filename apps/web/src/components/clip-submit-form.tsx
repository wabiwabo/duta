'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useClipControllerSubmitClip } from '@/generated/api/clip/clip';
import { SubmitClipDtoPlatform } from '@/generated/api/model/submitClipDtoPlatform';
import { useQueryClient } from '@tanstack/react-query';
import { getClipControllerListCampaignClipsQueryKey } from '@/generated/api/clip/clip';

const PLATFORM_OPTIONS: { label: string; value: SubmitClipDtoPlatform }[] = [
  { label: 'TikTok', value: SubmitClipDtoPlatform.tiktok },
  { label: 'Instagram Reels', value: SubmitClipDtoPlatform.reels },
  { label: 'YouTube Shorts', value: SubmitClipDtoPlatform.shorts },
];

interface ClipSubmitFormProps {
  campaignId: string;
}

export function ClipSubmitForm({ campaignId }: ClipSubmitFormProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<SubmitClipDtoPlatform>(SubmitClipDtoPlatform.tiktok);
  const [urlError, setUrlError] = useState('');

  const queryClient = useQueryClient();
  const { mutate, isPending } = useClipControllerSubmitClip({
    mutation: {
      onSuccess: () => {
        toast.success('Clip berhasil disubmit! Menunggu review dari owner campaign.');
        setUrl('');
        setPlatform(SubmitClipDtoPlatform.tiktok);
        setUrlError('');
        queryClient.invalidateQueries({
          queryKey: getClipControllerListCampaignClipsQueryKey(campaignId),
        });
      },
      onError: (error: unknown) => {
        const msg =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response &&
          error.response.data &&
          typeof error.response.data === 'object' &&
          'message' in error.response.data
            ? String((error.response.data as { message: unknown }).message)
            : 'Gagal submit clip. Coba lagi.';
        toast.error(msg);
      },
    },
  });

  function validateUrl(value: string): boolean {
    if (!value.trim()) {
      setUrlError('URL tidak boleh kosong.');
      return false;
    }
    try {
      new URL(value);
    } catch {
      setUrlError('URL tidak valid.');
      return false;
    }
    setUrlError('');
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateUrl(url)) return;
    mutate({ campaignId, data: { postedUrl: url, platform } });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="clip-url">URL Clip</Label>
        <Input
          id="clip-url"
          type="url"
          placeholder="https://www.tiktok.com/@username/video/..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (urlError) setUrlError('');
          }}
          disabled={isPending}
        />
        {urlError && <p className="text-xs text-destructive">{urlError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Platform</Label>
        <div className="flex gap-2 flex-wrap">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={isPending}
              onClick={() => setPlatform(opt.value)}
              className={[
                'px-3 py-1.5 rounded-md border text-sm font-medium transition-colors',
                platform === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-foreground hover:bg-accent',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? 'Submitting...' : 'Submit Clip'}
      </Button>
    </form>
  );
}
