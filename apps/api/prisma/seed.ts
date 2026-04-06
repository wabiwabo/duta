import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Seeding demo data ===');

  // ─── Users ──────────────────────────────────────────────────────────────────

  const andi = await prisma.user.upsert({
    where: { email: 'andi@demo.duta.id' },
    update: {},
    create: {
      id: 'demo-user-andi-001',
      logtoId: 'demo-logto-andi',
      name: 'Andi Creator',
      email: 'andi@demo.duta.id',
      role: 'owner',
      bio: 'Content creator & YouTuber spesialis teknologi dan gadget Indonesia.',
      verificationTier: 'tier2',
      nicheTags: ['tech', 'gadget', 'review'],
      emailVerified: true,
    },
  });

  const budi = await prisma.user.upsert({
    where: { email: 'budi@demo.duta.id' },
    update: {},
    create: {
      id: 'demo-user-budi-002',
      logtoId: 'demo-logto-budi',
      name: 'Budi Creator',
      email: 'budi@demo.duta.id',
      role: 'owner',
      bio: 'Podcaster bisnis digital dan investasi. Host "Ngobrol Duit" podcast.',
      verificationTier: 'tier1',
      nicheTags: ['bisnis', 'investasi', 'podcast'],
      emailVerified: true,
    },
  });

  const citra = await prisma.user.upsert({
    where: { email: 'citra@demo.duta.id' },
    update: {},
    create: {
      id: 'demo-user-citra-003',
      logtoId: 'demo-logto-citra',
      name: 'Citra Clipper',
      email: 'citra@demo.duta.id',
      role: 'clipper',
      bio: 'Clipper profesional, spesialis konten tech dan lifestyle. 50K+ total views.',
      verificationTier: 'tier2',
      clipperTier: 'gold',
      clipperScore: 850,
      nicheTags: ['tech', 'lifestyle', 'gaming'],
      emailVerified: true,
    },
  });

  const dewi = await prisma.user.upsert({
    where: { email: 'dewi@demo.duta.id' },
    update: {},
    create: {
      id: 'demo-user-dewi-004',
      logtoId: 'demo-logto-dewi',
      name: 'Dewi Clipper',
      email: 'dewi@demo.duta.id',
      role: 'clipper',
      bio: 'Content clipper fokus bisnis dan edukasi keuangan. Silver tier creator.',
      verificationTier: 'tier1',
      clipperTier: 'silver',
      clipperScore: 560,
      nicheTags: ['bisnis', 'edukasi', 'keuangan'],
      emailVerified: true,
    },
  });

  const eka = await prisma.user.upsert({
    where: { email: 'eka@demo.duta.id' },
    update: {},
    create: {
      id: 'demo-user-eka-005',
      logtoId: 'demo-logto-eka',
      name: 'Eka Clipper',
      email: 'eka@demo.duta.id',
      role: 'clipper',
      bio: 'Baru memulai journey sebagai content clipper. Semangat belajar!',
      verificationTier: 'tier0',
      clipperTier: 'bronze',
      clipperScore: 120,
      nicheTags: ['gaming', 'entertainment'],
      emailVerified: false,
    },
  });

  console.log('✓ 5 users seeded');

  // ─── Campaigns ──────────────────────────────────────────────────────────────

  const campaign1 = await prisma.campaign.upsert({
    where: { id: 'demo-camp-001' },
    update: {},
    create: {
      id: 'demo-camp-001',
      title: 'Cara Jadi Content Creator Sukses 2026',
      description:
        'Kami mencari clipper berbakat untuk membuat konten viral dari video tutorial kami tentang cara menjadi content creator sukses di era 2026. Konten harus informatif, engaging, dan sesuai dengan tren platform masing-masing.',
      type: 'bounty',
      ownerId: andi.id,
      budgetTotal: 5_000_000,
      budgetSpent: 950_000,
      ratePerKViews: 50_000,
      status: 'active',
      targetPlatforms: ['tiktok', 'reels', 'shorts'],
      guidelines:
        'Durasi 30-60 detik. Hook kuat di 3 detik pertama. Gunakan trending audio. Tambahkan CTA subscribe di akhir. Watermark tidak diperbolehkan.',
      sourceUrl: 'https://youtube.com/watch?v=demo-source-001',
    },
  });

  const campaign2 = await prisma.campaign.upsert({
    where: { id: 'demo-camp-002' },
    update: {},
    create: {
      id: 'demo-camp-002',
      title: 'Review Gadget Terbaru Samsung Galaxy',
      description:
        'Buat klip singkat review Samsung Galaxy terbaru. Fokus pada fitur kamera, performa gaming, dan daya tahan baterai. Konten harus jujur dan informatif.',
      type: 'gig',
      ownerId: andi.id,
      budgetTotal: 3_000_000,
      budgetSpent: 0,
      ratePerKViews: 75_000,
      status: 'active',
      targetPlatforms: ['shorts', 'reels'],
      guidelines:
        'Durasi 45-90 detik. Tunjukkan demo langsung produk. Sebutkan minimal 3 fitur unggulan. Bahasa Indonesia yang santai dan natural.',
      sourceUrl: 'https://youtube.com/watch?v=demo-source-002',
    },
  });

  const campaign3 = await prisma.campaign.upsert({
    where: { id: 'demo-camp-003' },
    update: {},
    create: {
      id: 'demo-camp-003',
      title: 'Podcast Bisnis Digital Indonesia',
      description:
        'Klip highlight dari episode podcast terbaik kami tentang bisnis digital di Indonesia. Pilih momen paling insightful dan buat menjadi konten pendek yang engaging.',
      type: 'podcast',
      ownerId: budi.id,
      budgetTotal: 2_000_000,
      budgetSpent: 200_000,
      ratePerKViews: 40_000,
      status: 'active',
      targetPlatforms: ['tiktok'],
      guidelines:
        'Clip durasi 30-60 detik dari episode podcast. Tambahkan subtitle/caption. Gunakan B-roll atau visualisasi data jika memungkinkan.',
      sourceUrl: 'https://open.spotify.com/show/demo-podcast-001',
    },
  });

  const campaign4 = await prisma.campaign.upsert({
    where: { id: 'demo-camp-004' },
    update: {},
    create: {
      id: 'demo-camp-004',
      title: 'Tips Investasi untuk Pemula',
      description:
        'Konten edukasi tentang investasi untuk generasi muda Indonesia. Fokus pada reksa dana, saham, dan crypto untuk pemula. Bahasa sederhana, mudah dipahami.',
      type: 'bounty',
      ownerId: budi.id,
      budgetTotal: 1_000_000,
      budgetSpent: 0,
      ratePerKViews: 30_000,
      status: 'draft',
      targetPlatforms: ['tiktok', 'shorts'],
      guidelines:
        'Durasi 45-75 detik. Gunakan angka dan contoh nyata. Tambahkan disclaimer investasi. Jangan berikan saran investasi spesifik.',
      sourceUrl: 'https://youtube.com/watch?v=demo-source-004',
    },
  });

  console.log('✓ 4 campaigns seeded');

  // ─── Clips ──────────────────────────────────────────────────────────────────

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

  await prisma.clip.upsert({
    where: { id: 'demo-clip-001' },
    update: {},
    create: {
      id: 'demo-clip-001',
      campaignId: campaign1.id,
      clipperId: citra.id,
      postedUrl: 'https://www.tiktok.com/@citra.clipper/video/demo001',
      platform: 'tiktok',
      status: 'approved',
      viewsVerified: 15_000,
      earningsAmount: 750_000,
      submittedAt: daysAgo(10),
      reviewedAt: daysAgo(8),
      reviewFeedback: 'Konten sangat bagus! Hook kuat dan CTA efektif. Approved.',
    },
  });

  await prisma.clip.upsert({
    where: { id: 'demo-clip-002' },
    update: {},
    create: {
      id: 'demo-clip-002',
      campaignId: campaign2.id,
      clipperId: citra.id,
      postedUrl: 'https://www.youtube.com/shorts/demo002',
      platform: 'shorts',
      status: 'submitted',
      viewsVerified: 0,
      earningsAmount: 0,
      submittedAt: daysAgo(1),
      reviewedAt: null,
    },
  });

  await prisma.clip.upsert({
    where: { id: 'demo-clip-003' },
    update: {},
    create: {
      id: 'demo-clip-003',
      campaignId: campaign1.id,
      clipperId: dewi.id,
      postedUrl: 'https://www.tiktok.com/@dewi.clipper/video/demo003',
      platform: 'tiktok',
      status: 'under_review',
      viewsVerified: 8_000,
      earningsAmount: 0,
      submittedAt: daysAgo(3),
      reviewedAt: null,
    },
  });

  await prisma.clip.upsert({
    where: { id: 'demo-clip-004' },
    update: {},
    create: {
      id: 'demo-clip-004',
      campaignId: campaign3.id,
      clipperId: dewi.id,
      postedUrl: 'https://www.tiktok.com/@dewi.clipper/video/demo004',
      platform: 'tiktok',
      status: 'approved',
      viewsVerified: 5_000,
      earningsAmount: 200_000,
      submittedAt: daysAgo(7),
      reviewedAt: daysAgo(5),
      reviewFeedback: 'Pilihan momen yang tepat. Subtitle rapi dan informatif.',
    },
  });

  await prisma.clip.upsert({
    where: { id: 'demo-clip-005' },
    update: {},
    create: {
      id: 'demo-clip-005',
      campaignId: campaign1.id,
      clipperId: eka.id,
      postedUrl: 'https://www.tiktok.com/@eka.clipper/video/demo005',
      platform: 'tiktok',
      status: 'rejected',
      viewsVerified: 0,
      earningsAmount: 0,
      submittedAt: daysAgo(5),
      reviewedAt: daysAgo(4),
      reviewFeedback: 'Durasi terlalu pendek, hanya 18 detik. Minimum 30 detik sesuai guidelines.',
    },
  });

  await prisma.clip.upsert({
    where: { id: 'demo-clip-006' },
    update: {},
    create: {
      id: 'demo-clip-006',
      campaignId: campaign2.id,
      clipperId: eka.id,
      postedUrl: 'https://www.instagram.com/reel/demo006',
      platform: 'reels',
      status: 'revision',
      viewsVerified: 0,
      earningsAmount: 0,
      submittedAt: daysAgo(2),
      reviewedAt: daysAgo(1),
      reviewFeedback: 'Tambahkan CTA di akhir video. Contoh: "Follow untuk tips gadget terbaru!"',
    },
  });

  console.log('✓ 6 clips seeded');

  // ─── Escrow Accounts ─────────────────────────────────────────────────────────

  await prisma.escrowAccount.upsert({
    where: { campaignId: campaign1.id },
    update: {},
    create: {
      id: 'demo-escrow-001',
      campaignId: campaign1.id,
      totalDeposited: 5_000_000,
      totalReleased: 750_000,
      totalRefunded: 0,
      balance: 4_000_000,
      status: 'active',
    },
  });

  await prisma.escrowAccount.upsert({
    where: { campaignId: campaign2.id },
    update: {},
    create: {
      id: 'demo-escrow-002',
      campaignId: campaign2.id,
      totalDeposited: 3_000_000,
      totalReleased: 0,
      totalRefunded: 0,
      balance: 2_500_000,
      status: 'active',
    },
  });

  await prisma.escrowAccount.upsert({
    where: { campaignId: campaign3.id },
    update: {},
    create: {
      id: 'demo-escrow-003',
      campaignId: campaign3.id,
      totalDeposited: 2_000_000,
      totalReleased: 200_000,
      totalRefunded: 0,
      balance: 1_800_000,
      status: 'active',
    },
  });

  console.log('✓ 3 escrow accounts seeded');

  // ─── Notifications ────────────────────────────────────────────────────────────

  const notifications = [
    // Citra — clip approved
    {
      id: 'demo-notif-001',
      userId: citra.id,
      type: 'clip_approved' as const,
      title: 'Klip kamu diapprove!',
      body: 'Klip untuk campaign "Cara Jadi Content Creator Sukses 2026" telah disetujui. Kamu mendapatkan Rp750.000!',
      data: { clipId: 'demo-clip-001', campaignId: campaign1.id, earnings: 750_000 },
    },
    // Citra — clip submitted
    {
      id: 'demo-notif-002',
      userId: citra.id,
      type: 'clip_submitted' as const,
      title: 'Klip berhasil disubmit',
      body: 'Klip untuk "Review Gadget Terbaru Samsung Galaxy" sedang dalam antrian review.',
      data: { clipId: 'demo-clip-002', campaignId: campaign2.id },
    },
    // Dewi — clip under review
    {
      id: 'demo-notif-003',
      userId: dewi.id,
      type: 'clip_submitted' as const,
      title: 'Klip sedang direview',
      body: 'Klip kamu untuk "Cara Jadi Content Creator Sukses 2026" sedang dalam proses review.',
      data: { clipId: 'demo-clip-003', campaignId: campaign1.id },
    },
    // Dewi — payment received
    {
      id: 'demo-notif-004',
      userId: dewi.id,
      type: 'payment_received' as const,
      title: 'Pembayaran diterima!',
      body: 'Rp200.000 telah masuk ke saldo kamu dari campaign "Podcast Bisnis Digital Indonesia".',
      data: { clipId: 'demo-clip-004', amount: 200_000 },
    },
    // Eka — clip rejected
    {
      id: 'demo-notif-005',
      userId: eka.id,
      type: 'clip_rejected' as const,
      title: 'Klip ditolak',
      body: 'Klip kamu untuk "Cara Jadi Content Creator Sukses 2026" ditolak. Durasi terlalu pendek.',
      data: { clipId: 'demo-clip-005', campaignId: campaign1.id },
    },
    // Eka — revision requested
    {
      id: 'demo-notif-006',
      userId: eka.id,
      type: 'clip_revision' as const,
      title: 'Revisi diperlukan',
      body: 'Klip untuk "Review Gadget Terbaru Samsung Galaxy" perlu direvisi. Cek feedback dari owner.',
      data: { clipId: 'demo-clip-006', campaignId: campaign2.id },
    },
    // Andi — clip submitted to his campaign
    {
      id: 'demo-notif-007',
      userId: andi.id,
      type: 'clip_submitted' as const,
      title: 'Klip baru masuk!',
      body: 'Citra Clipper telah mengirim klip untuk campaign "Review Gadget Terbaru Samsung Galaxy".',
      data: { clipId: 'demo-clip-002', campaignId: campaign2.id },
    },
    // Budi — system notification
    {
      id: 'demo-notif-008',
      userId: budi.id,
      type: 'system' as const,
      title: 'Selamat datang di Duta!',
      body: 'Campaign kamu "Podcast Bisnis Digital Indonesia" sudah aktif dan menerima submission klip.',
      data: { campaignId: campaign3.id },
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: {},
      create: notif,
    });
  }

  console.log('✓ 8 notifications seeded');
  console.log('');
  console.log('=== Seed complete ===');
  console.log('');
  console.log('Demo accounts:');
  console.log('  andi@demo.duta.id   (owner)   — 2 campaigns');
  console.log('  budi@demo.duta.id   (owner)   — 2 campaigns');
  console.log('  citra@demo.duta.id  (clipper) — gold tier, 2 clips');
  console.log('  dewi@demo.duta.id   (clipper) — silver tier, 2 clips');
  console.log('  eka@demo.duta.id    (clipper) — bronze tier, 2 clips');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
