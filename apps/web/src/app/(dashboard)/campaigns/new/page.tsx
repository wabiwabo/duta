'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GradientButton } from '@/components/ui/gradient-button';
import { useCampaignControllerCreateCampaign } from '@/generated/api/campaign/campaign';
import {
  useAiControllerGenerateBrief,
  useAiControllerMatchClippers,
} from '@/generated/api/ai/ai';
import type { MatchedClipperDto } from '@/generated/api/model';
import { CreateCampaignDtoType } from '@/generated/api/model/createCampaignDtoType';
import { CreateCampaignDtoSourceType } from '@/generated/api/model/createCampaignDtoSourceType';
import {
  Briefcase,
  Mic2,
  ChevronLeft,
  Check,
  TrendingUp,
  Sparkles,
  Users,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp, springBouncy } from '@/lib/motion';

// ─── Types ───────────────────────────────────────────────────────────────────

type CampaignType = 'bounty' | 'gig' | 'podcast';
type Platform = 'tiktok' | 'reels' | 'shorts';

interface WizardData {
  type: CampaignType | null;
  title: string;
  description: string;
  sourceUrl: string;
  describeOnly: boolean;
  ratePerKViews: string;
  budgetTotal: string;
  targetPlatforms: Platform[];
  deadline: string;
  guidelines: string;
}

const INITIAL_DATA: WizardData = {
  type: null,
  title: '',
  description: '',
  sourceUrl: '',
  describeOnly: false,
  ratePerKViews: '',
  budgetTotal: '',
  targetPlatforms: [],
  deadline: '',
  guidelines: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(value: string): string {
  const num = parseInt(value.replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
}

function parseRupiah(value: string): number {
  return parseInt(value.replace(/\./g, '').replace(/\D/g, ''), 10) || 0;
}

function formatRupiahDisplay(num: number): string {
  return `Rp ${num.toLocaleString('id-ID')}`;
}

// ─── Step Progress Indicator ─────────────────────────────────────────────────

const STEP_LABELS = ['Tipe Campaign', 'Konten', 'Rate & Budget', 'Guidelines', 'Review'];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={stepNum} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-semibold transition-all shrink-0',
                    isCompleted && 'gradient-fill border-transparent text-white',
                    isCurrent && 'bg-background border-primary text-primary',
                    !isCompleted && !isCurrent && 'bg-background border-muted-foreground/30 text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNum}
                </div>
                <span
                  className={cn(
                    'text-xs text-center leading-tight hidden sm:block',
                    isCurrent ? 'text-primary font-medium' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded overflow-hidden bg-muted">
                  <motion.div
                    className="h-full gradient-fill"
                    initial={{ width: '0%' }}
                    animate={{ width: stepNum < currentStep ? '100%' : '0%' }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 1: Campaign Type ────────────────────────────────────────────────────

const CAMPAIGN_TYPES = [
  {
    value: 'bounty' as CampaignType,
    icon: TrendingUp,
    title: 'Bounty',
    description: 'Bayar per view. Terbuka untuk semua clipper. Post link, dapatkan per 1K views.',
    tag: 'Paling Populer',
  },
  {
    value: 'gig' as CampaignType,
    icon: Briefcase,
    title: 'Gig',
    description: 'Rekrut clipper tertentu. Upload clip untuk direview sebelum diposting.',
    tag: null,
  },
  {
    value: 'podcast' as CampaignType,
    icon: Mic2,
    title: 'Podcast',
    description: 'Clip podcast kamu. Konversi audio-to-video dengan transkripsi otomatis.',
    tag: 'Segera Hadir',
  },
];

function Step1TypeSelect({
  onSelect,
}: {
  onSelect: (type: CampaignType) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Pilih Tipe Campaign</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pilih model distribusi yang sesuai dengan tujuan campaign kamu.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CAMPAIGN_TYPES.map(({ value, icon: Icon, title, description, tag }) => {
          const isPodcast = value === 'podcast';
          return (
            <motion.button
              key={value}
              disabled={isPodcast}
              onClick={() => !isPodcast && onSelect(value)}
              whileHover={isPodcast ? {} : { y: -8, transition: springBouncy }}
              whileTap={isPodcast ? {} : { scale: 0.97 }}
              className={cn(
                'group relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all',
                'glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isPodcast
                  ? 'cursor-not-allowed opacity-60 border-border'
                  : 'cursor-pointer hover:border-primary border-border',
              )}
            >
              {tag && (
                <span
                  className={cn(
                    'absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    isPodcast
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {tag}
                </span>
              )}
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  isPodcast ? 'bg-muted' : 'bg-primary/10 group-hover:bg-primary/20',
                )}
              >
                <Icon className={cn('h-5 w-5', isPodcast ? 'text-muted-foreground' : 'text-primary')} />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Content Source ───────────────────────────────────────────────────

function Step2Content({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const isPodcast = data.type === 'podcast';

  function validate() {
    const errs: typeof errors = {};
    if (!data.title.trim()) errs.title = 'Judul campaign wajib diisi.';
    if (!data.description.trim()) errs.description = 'Deskripsi campaign wajib diisi.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Konten Campaign</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Beri tahu clipper tentang campaign kamu.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* Title */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <Label htmlFor="title">
            Judul Campaign <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Contoh: Campaign Viral TikTok — Produk Skincare X"
            value={data.title}
            maxLength={200}
            onChange={(e) => onChange({ title: e.target.value })}
            aria-invalid={!!errors.title}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </motion.div>

        {/* Description */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <Label htmlFor="description">
            Deskripsi <span className="text-destructive">*</span>
          </Label>
          <textarea
            id="description"
            placeholder="Ceritakan tentang brand kamu, produk yang dipromosikan, dan tujuan campaign ini..."
            value={data.description}
            maxLength={5000}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
            className={cn(
              'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground resize-y',
              'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              errors.description && 'border-destructive',
            )}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
        </motion.div>

        {/* Source Content */}
        <motion.div variants={fadeUp} className="space-y-3">
          <Label>Konten Sumber</Label>
          {isPodcast ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Mic2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Upload konten podcast akan tersedia di versi 1.1.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ describeOnly: false, sourceUrl: '' })}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-all',
                    !data.describeOnly
                      ? 'gradient-fill text-white border-transparent'
                      : 'border-border text-muted-foreground hover:border-foreground/50',
                  )}
                >
                  YouTube URL
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ describeOnly: true, sourceUrl: '' })}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-all',
                    data.describeOnly
                      ? 'gradient-fill text-white border-transparent'
                      : 'border-border text-muted-foreground hover:border-foreground/50',
                  )}
                >
                  Deskripsikan saja
                </button>
              </div>

              {!data.describeOnly && (
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={data.sourceUrl}
                  onChange={(e) => onChange({ sourceUrl: e.target.value })}
                  type="url"
                />
              )}
              {data.describeOnly && (
                <p className="text-xs text-muted-foreground">
                  Clipper akan memahami konten yang diinginkan dari deskripsi campaign kamu.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      <StepNav onBack={onBack} onNext={handleNext} />
    </div>
  );
}

// ─── Step 3: Rate & Budget ────────────────────────────────────────────────────

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'reels', label: 'Instagram Reels' },
  { value: 'shorts', label: 'YouTube Shorts' },
];

function Step3RateBudget({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<{ budget?: string; rate?: string }>({});

  const rate = parseRupiah(data.ratePerKViews);
  const budget = parseRupiah(data.budgetTotal);
  const estimatedKViews = rate > 0 && budget > 0 ? Math.floor(budget / rate) : 0;

  function handleRateInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
    onChange({ ratePerKViews: raw ? formatRupiah(raw) : '' });
  }

  function handleBudgetInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
    onChange({ budgetTotal: raw ? formatRupiah(raw) : '' });
  }

  function togglePlatform(p: Platform) {
    const current = data.targetPlatforms;
    onChange({
      targetPlatforms: current.includes(p)
        ? current.filter((x) => x !== p)
        : [...current, p],
    });
  }

  function validate() {
    const errs: typeof errors = {};
    if (budget < 50000) errs.budget = 'Minimum total budget adalah Rp 50.000.';
    if (data.ratePerKViews && rate < 1000) errs.rate = 'Minimum rate adalah Rp 1.000/1K views.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Rate & Budget</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tentukan berapa kamu mau bayar dan total anggaran campaign.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* Rate */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <Label htmlFor="rate">Rate per 1.000 Views (Rupiah)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
              Rp
            </span>
            <Input
              id="rate"
              className="pl-9"
              placeholder="5.000"
              value={data.ratePerKViews}
              onChange={handleRateInput}
              inputMode="numeric"
              aria-invalid={!!errors.rate}
            />
          </div>
          {errors.rate ? (
            <p className="text-xs text-destructive">{errors.rate}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Contoh: Rp 5.000 = clipper mendapat Rp 5.000 untuk setiap 1.000 views.
            </p>
          )}
        </motion.div>

        {/* Total Budget */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <Label htmlFor="budget">
            Total Budget <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
              Rp
            </span>
            <Input
              id="budget"
              className="pl-9"
              placeholder="500.000"
              value={data.budgetTotal}
              onChange={handleBudgetInput}
              inputMode="numeric"
              aria-invalid={!!errors.budget}
            />
          </div>
          {errors.budget ? (
            <p className="text-xs text-destructive">{errors.budget}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Minimum total budget: Rp 50.000</p>
          )}
        </motion.div>

        {/* Budget explanation */}
        {rate > 0 && budget > 0 && (
          <motion.div variants={fadeUp} className="glass rounded-lg px-4 py-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Estimasi jangkauan</p>
            <p className="text-sm font-semibold text-primary">
              {formatRupiahDisplay(budget)} ÷ {formatRupiahDisplay(rate)}/1K ={' '}
              <span>~{estimatedKViews.toLocaleString('id-ID')}K views</span>
            </p>
          </motion.div>
        )}

        {/* Target Platforms */}
        <motion.div variants={fadeUp} className="space-y-2">
          <Label>Target Platform (opsional)</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(({ value, label }) => {
              const selected = data.targetPlatforms.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePlatform(value)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-all',
                    selected
                      ? 'gradient-fill text-white border-transparent'
                      : 'border-border text-muted-foreground hover:border-foreground/50',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Deadline */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <Label htmlFor="deadline">Deadline (opsional)</Label>
          <Input
            id="deadline"
            type="date"
            value={data.deadline}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => onChange({ deadline: e.target.value })}
            className="w-fit"
          />
        </motion.div>
      </motion.div>

      <StepNav onBack={onBack} onNext={handleNext} />
    </div>
  );
}

// ─── Step 4: Guidelines ───────────────────────────────────────────────────────

function Step4Guidelines({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Guidelines</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Beri arahan kepada clipper tentang konten yang kamu inginkan.
        </p>
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-1.5">
        <Label htmlFor="guidelines">Instruksi untuk Clipper (opsional)</Label>
        <textarea
          id="guidelines"
          placeholder="Ceritakan kepada clipper apa yang kamu inginkan: gaya, tone, hal yang boleh dan tidak boleh dilakukan...&#10;&#10;Contoh:&#10;- Fokus pada fitur utama produk&#10;- Gunakan musik yang upbeat&#10;- Hindari konten sensitif&#10;- Sertakan CTA di akhir video"
          value={data.guidelines}
          maxLength={10000}
          onChange={(e) => onChange({ guidelines: e.target.value })}
          rows={8}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground resize-y focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          {data.guidelines.length}/10.000 karakter
        </p>
      </motion.div>

      <StepNav onBack={onBack} onNext={onNext} nextLabel="Lanjut ke Review" />
    </div>
  );
}

// ─── Step 5: Review & Submit ──────────────────────────────────────────────────

const TYPE_META: Record<CampaignType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  bounty: { label: 'Bounty', icon: TrendingUp },
  gig: { label: 'Gig', icon: Briefcase },
  podcast: { label: 'Podcast', icon: Mic2 },
};

function ReviewRow({
  label,
  value,
  onEdit,
  missing,
}: {
  label: string;
  value: string | null;
  onEdit: () => void;
  missing?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p
          className={cn(
            'text-sm break-words',
            missing ? 'text-muted-foreground italic' : 'font-medium',
          )}
        >
          {value ?? '—'}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs text-primary hover:underline shrink-0"
      >
        Ubah
      </button>
    </div>
  );
}

function Step5Review({
  data,
  onBack,
  onSubmit,
  isSubmitting,
  goToStep,
}: {
  data: WizardData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  goToStep: (step: number) => void;
}) {
  const rate = parseRupiah(data.ratePerKViews);
  const budget = parseRupiah(data.budgetTotal);
  const meta = data.type ? TYPE_META[data.type] : null;
  const TypeIcon = meta?.icon;

  const summaryRows = [
    { label: 'Tipe Campaign', value: data.type ?? null, step: 1 },
    { label: 'Judul Campaign', value: data.title || null, step: 2 },
    {
      label: 'Deskripsi',
      value: data.description.length > 120 ? data.description.slice(0, 120) + '...' : data.description || null,
      step: 2,
    },
    ...(data.sourceUrl ? [{ label: 'Konten Sumber', value: data.sourceUrl, step: 2 }] : []),
    ...(rate > 0 ? [{ label: 'Rate per 1K Views', value: formatRupiahDisplay(rate), step: 3 }] : []),
    {
      label: 'Total Budget',
      value: budget > 0 ? formatRupiahDisplay(budget) : null,
      step: 3,
      missing: budget === 0,
    },
    ...(data.targetPlatforms.length > 0
      ? [{ label: 'Target Platform', value: data.targetPlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', '), step: 3 }]
      : []),
    ...(data.deadline
      ? [{
          label: 'Deadline',
          value: new Date(data.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          step: 3,
        }]
      : []),
    {
      label: 'Guidelines',
      value: data.guidelines
        ? data.guidelines.length > 120 ? data.guidelines.slice(0, 120) + '...' : data.guidelines
        : null,
      step: 4,
      missing: !data.guidelines,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Periksa kembali detail campaign sebelum membuat.
        </p>
      </div>

      {/* Summary Card */}
      <div className="glass rounded-xl overflow-hidden">
        {/* Type header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          {TypeIcon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <TypeIcon className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Tipe Campaign</p>
            <p className="text-sm font-semibold capitalize">{data.type}</p>
          </div>
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="ml-auto text-xs text-primary hover:underline"
          >
            Ubah
          </button>
        </div>

        {/* Staggered summary rows */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="px-5 divide-y divide-border/40"
        >
          {summaryRows.slice(1).map((row) => (
            <motion.div key={row.label} variants={fadeUp}>
              <ReviewRow
                label={row.label}
                value={row.value ?? null}
                onEdit={() => goToStep(row.step)}
                missing={row.missing}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Kembali
        </Button>
        <GradientButton
          variant="gradient"
          size="lg"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="flex-1 sm:flex-none sm:min-w-40 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Membuat Campaign...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Buat Campaign
            </>
          )}
        </GradientButton>
      </div>
    </div>
  );
}

// ─── Shared Step Nav ──────────────────────────────────────────────────────────

function StepNav({
  onBack,
  onNext,
  nextLabel = 'Lanjutkan',
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <Button type="button" variant="outline" onClick={onBack} className="gap-1.5">
        <ChevronLeft className="h-4 w-4" />
        Kembali
      </Button>
      <Button type="button" onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
}

// ─── AI: Generate Brief ───────────────────────────────────────────────────────

function AiBriefButton({
  campaignType,
  targetPlatforms,
  onApply,
}: {
  campaignType: CampaignType;
  targetPlatforms: Platform[];
  onApply: (brief: { title: string; description: string; guidelines: string }) => void;
}) {
  const [topic, setTopic] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { mutate, isPending } = useAiControllerGenerateBrief({
    mutation: {
      onSuccess: (result) => {
        onApply(result);
        setShowForm(false);
        setTopic('');
        toast.success('Brief berhasil dibuat oleh AI!');
      },
      onError: () => toast.error('Gagal menghasilkan brief.'),
    },
  });

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Gunakan AI untuk mengisi brief
      </button>
    );
  }

  return (
    <div className="glass rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <Sparkles className={cn('h-4 w-4 text-primary', isPending && 'animate-spin')} />
        AI Brief Generator
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Topik atau nama produk (cth: Skincare lokal, Kopi premium...)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          disabled={isPending || !topic.trim()}
          className={cn('gradient-fill text-white', isPending && 'opacity-80')}
          onClick={() =>
            mutate({
              data: {
                topic: topic.trim(),
                type: campaignType,
                targetPlatforms: targetPlatforms.length > 0 ? targetPlatforms : ['tiktok'],
              },
            })
          }
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Generating...
            </span>
          ) : (
            'Generate'
          )}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Batal
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        AI akan mengisi judul, deskripsi, dan guidelines secara otomatis.
      </p>
    </div>
  );
}

// ─── AI: Match Clippers ───────────────────────────────────────────────────────

function AiMatchClippersButton({ targetPlatforms }: { targetPlatforms: Platform[] }) {
  const [results, setResults] = useState<MatchedClipperDto[] | null>(null);
  const [showResults, setShowResults] = useState(false);

  const { mutate, isPending } = useAiControllerMatchClippers({
    mutation: {
      onSuccess: (data) => {
        setResults(data);
        setShowResults(true);
      },
      onError: () => toast.error('Gagal mencari clipper yang cocok.'),
    },
  });

  const tierColors: Record<string, string> = {
    bronze: 'text-amber-600',
    silver: 'text-slate-400',
    gold: 'text-yellow-500',
    platinum: 'text-cyan-400',
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setShowResults(false);
          mutate({ data: { platforms: targetPlatforms.length > 0 ? targetPlatforms : undefined } });
        }}
        disabled={isPending}
        className="gap-1.5"
      >
        <Users className="h-4 w-4" />
        {isPending ? 'Mencari...' : 'Temukan Clipper Terbaik'}
      </Button>

      {showResults && results && (
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Top Clipper yang Cocok</p>
            <button
              type="button"
              onClick={() => setShowResults(false)}
              className="text-xs text-muted-foreground hover:underline"
            >
              Tutup
            </button>
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              Tidak ada clipper yang ditemukan.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {results.map((c) => (
                <div key={c.userId} className="py-2.5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.matchReasons.slice(0, 2).join(' · ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-xs font-semibold capitalize', tierColors[c.clipperTier] ?? '')}>
                      {c.clipperTier}
                    </p>
                    <p className="text-xs text-muted-foreground">Score: {c.matchScore}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard Page ─────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);

  const { mutate: createCampaign, isPending } = useCampaignControllerCreateCampaign({
    mutation: {
      onSuccess: (result) => {
        toast.success('Campaign berhasil dibuat!');
        router.push(`/campaigns/${result.id}`);
      },
      onError: () => {
        toast.error('Gagal membuat campaign. Silakan coba lagi.');
      },
    },
  });

  function update(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function goToStep(s: number) {
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleTypeSelect(type: CampaignType) {
    update({ type });
    goToStep(2);
  }

  function handleSubmit() {
    const rate = parseRupiah(data.ratePerKViews);
    const budget = parseRupiah(data.budgetTotal);

    const payload: Parameters<typeof createCampaign>[0]['data'] = {
      type: data.type! as (typeof CreateCampaignDtoType)[keyof typeof CreateCampaignDtoType],
      title: data.title.trim(),
      description: data.description.trim(),
      budgetTotal: budget,
      ...(data.guidelines.trim() && { guidelines: data.guidelines.trim() }),
      ...(rate > 0 && { ratePerKViews: rate }),
      ...(!data.describeOnly && data.sourceUrl.trim() && {
        sourceType: CreateCampaignDtoSourceType.youtube_url,
        sourceUrl: data.sourceUrl.trim(),
      }),
      ...(data.targetPlatforms.length > 0 && { targetPlatforms: data.targetPlatforms }),
      ...(data.deadline && { deadline: new Date(data.deadline).toISOString() }),
    };

    createCampaign({ data: payload });
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buat Campaign Baru</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ikuti langkah-langkah berikut untuk membuat campaign distribusi kontenmu.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* Steps */}
      <div className="glass rounded-xl p-6 shadow-sm">
        {step === 1 && <Step1TypeSelect onSelect={handleTypeSelect} />}

        {step === 2 && (
          <div className="space-y-6">
            {data.type && (
              <AiBriefButton
                campaignType={data.type}
                targetPlatforms={data.targetPlatforms}
                onApply={(brief) => update(brief)}
              />
            )}
            <Step2Content
              data={data}
              onChange={update}
              onNext={() => goToStep(3)}
              onBack={() => goToStep(1)}
            />
          </div>
        )}

        {step === 3 && (
          <Step3RateBudget
            data={data}
            onChange={update}
            onNext={() => goToStep(4)}
            onBack={() => goToStep(2)}
          />
        )}

        {step === 4 && (
          <Step4Guidelines
            data={data}
            onChange={update}
            onNext={() => goToStep(5)}
            onBack={() => goToStep(3)}
          />
        )}

        {step === 5 && (
          <div className="space-y-6">
            <Step5Review
              data={data}
              onBack={() => goToStep(4)}
              onSubmit={handleSubmit}
              isSubmitting={isPending}
              goToStep={goToStep}
            />
            <div className="border-t border-border/40 pt-4">
              <p className="text-xs text-muted-foreground mb-3">
                Opsional: Cari clipper yang cocok untuk campaign ini sebelum membuat.
              </p>
              <AiMatchClippersButton targetPlatforms={data.targetPlatforms} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
