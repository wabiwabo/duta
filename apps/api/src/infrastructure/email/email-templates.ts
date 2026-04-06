const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #1a1a1a;
  color: #f5f5f5;
  margin: 0;
  padding: 0;
`;

const cardStyle = `
  background-color: #222222;
  border-radius: 12px;
  padding: 40px;
  max-width: 560px;
  margin: 40px auto;
  border: 1px solid #2e2e2e;
`;

const logoHtml = `
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #7c3aed, #22c55e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -1px;
    ">Duta</span>
  </div>
`;

const footerHtml = `
  <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #2e2e2e; color: #a0a0a0; font-size: 13px; line-height: 1.6;">
    <p style="margin: 0 0 8px 0;">© 2026 Duta. All rights reserved.</p>
    <p style="margin: 0;"><a href="#" style="color: #a0a0a0; text-decoration: underline;">Berhenti berlangganan email ini</a></p>
  </div>
`;

function wrapInBase(content: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Duta Email</title>
</head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    ${logoHtml}
    ${content}
    ${footerHtml}
  </div>
</body>
</html>`;
}

function ctaButton(text: string, href: string): string {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${href}" style="
        display: inline-block;
        background: linear-gradient(135deg, #7c3aed, #22c55e);
        color: #ffffff;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 15px;
        letter-spacing: 0.3px;
      ">${text}</a>
    </div>
  `;
}

// ─── Template: Welcome ───────────────────────────────────────────────────────

export interface WelcomeData {
  userName: string;
  role: string; // 'creator' | 'clipper'
}

export function welcomeTemplate(data: WelcomeData): { subject: string; html: string } {
  const roleLabel = data.role === 'creator' ? 'Creator' : 'Clipper';
  const roleDesc =
    data.role === 'creator'
      ? 'Buat kampanye, kelola konten, dan temukan clipper terbaik untuk brand kamu.'
      : 'Temukan kampanye menarik, buat clip keren, dan mulai menghasilkan pendapatan.';

  const html = wrapInBase(`
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #f5f5f5;">
      Selamat datang, ${data.userName}! 👋
    </h1>
    <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px 0;">
      Kamu telah bergabung di Duta sebagai <strong style="color: #f5f5f5;">${roleLabel}</strong>.
    </p>
    <p style="color: #f5f5f5; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
      ${roleDesc}
    </p>
    <p style="color: #f5f5f5; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      Langkah berikutnya — lengkapi profilmu agar kamu siap untuk memulai.
    </p>
    ${ctaButton('Lengkapi Profil', 'https://duta.val.id/dashboard/profile')}
    <p style="color: #a0a0a0; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
      Ada pertanyaan? Balas email ini atau hubungi kami melalui platform.
    </p>
  `);

  return {
    subject: 'Selamat datang di Duta!',
    html,
  };
}

// ─── Template: Clip Approved ─────────────────────────────────────────────────

export interface ClipApprovedData {
  clipperName: string;
  campaignTitle: string;
  earningsAmount?: number;
}

export function clipApprovedTemplate(data: ClipApprovedData): { subject: string; html: string } {
  const earningsBlock = data.earningsAmount
    ? `<div style="background: #1a1a1a; border: 1px solid #2e2e2e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #a0a0a0; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">Pendapatan</p>
        <p style="font-size: 28px; font-weight: 700; color: #22c55e; margin: 0;">Rp ${data.earningsAmount.toLocaleString('id-ID')}</p>
      </div>`
    : '';

  const html = wrapInBase(`
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #f5f5f5;">
      Clip kamu disetujui! 🎉
    </h1>
    <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px 0;">
      Hei <strong style="color: #f5f5f5;">${data.clipperName}</strong>, kabar baik untukmu!
    </p>
    <p style="color: #f5f5f5; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
      Clip kamu untuk kampanye <strong style="color: #7c3aed;">${data.campaignTitle}</strong> telah <strong style="color: #22c55e;">disetujui</strong> oleh kreator.
    </p>
    ${earningsBlock}
    <p style="color: #f5f5f5; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      Kamu bisa lihat detail clip dan status pendapatan di dashboard kamu.
    </p>
    ${ctaButton('Lihat Dashboard', 'https://duta.val.id/dashboard/earnings')}
  `);

  return {
    subject: 'Clip kamu diapprove! 🎉',
    html,
  };
}

// ─── Template: Clip Rejected ─────────────────────────────────────────────────

export interface ClipRejectedData {
  clipperName: string;
  campaignTitle: string;
  feedback?: string;
}

export function clipRejectedTemplate(data: ClipRejectedData): { subject: string; html: string } {
  const feedbackBlock = data.feedback
    ? `<div style="background: #1a1a1a; border-left: 3px solid #7c3aed; border-radius: 4px; padding: 16px 20px; margin: 20px 0;">
        <p style="color: #a0a0a0; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Catatan dari reviewer</p>
        <p style="color: #f5f5f5; font-size: 15px; line-height: 1.6; margin: 0;">${data.feedback}</p>
      </div>`
    : '';

  const html = wrapInBase(`
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #f5f5f5;">
      Update untuk clip kamu
    </h1>
    <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px 0;">
      Hei <strong style="color: #f5f5f5;">${data.clipperName}</strong>,
    </p>
    <p style="color: #f5f5f5; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
      Clip kamu untuk kampanye <strong style="color: #7c3aed;">${data.campaignTitle}</strong> belum bisa disetujui saat ini.
    </p>
    ${feedbackBlock}
    <p style="color: #f5f5f5; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      Jangan menyerah! Kamu bisa merevisi dan mengirim ulang clip, atau coba kampanye lain yang sesuai.
    </p>
    ${ctaButton('Lihat Kampanye Lain', 'https://duta.val.id/dashboard/campaigns')}
  `);

  return {
    subject: 'Update clip kamu',
    html,
  };
}

// ─── Template: Payment Received ──────────────────────────────────────────────

export interface PaymentReceivedData {
  clipperName: string;
  amount: number;
  campaignTitle: string;
}

export function paymentReceivedTemplate(data: PaymentReceivedData): { subject: string; html: string } {
  const formattedAmount = data.amount.toLocaleString('id-ID');

  const html = wrapInBase(`
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #f5f5f5;">
      Pembayaran diterima 💸
    </h1>
    <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px 0;">
      Hei <strong style="color: #f5f5f5;">${data.clipperName}</strong>, pembayaranmu sudah diproses!
    </p>
    <div style="background: #1a1a1a; border: 1px solid #2e2e2e; border-radius: 8px; padding: 28px; margin: 0 0 24px 0; text-align: center;">
      <p style="color: #a0a0a0; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Total Pembayaran</p>
      <p style="font-size: 36px; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #22c55e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 8px 0;">Rp ${formattedAmount}</p>
      <p style="color: #a0a0a0; font-size: 14px; margin: 0;">dari kampanye <strong style="color: #f5f5f5;">${data.campaignTitle}</strong></p>
    </div>
    <p style="color: #f5f5f5; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      Dana akan masuk ke rekening yang terdaftar dalam 1–3 hari kerja. Kamu bisa cek riwayat pembayaran di dashboard.
    </p>
    ${ctaButton('Lihat Riwayat Pembayaran', 'https://duta.val.id/dashboard/earnings')}
  `);

  return {
    subject: `Pembayaran diterima — Rp ${formattedAmount}`,
    html,
  };
}

// ─── Template: New Clip Submitted ────────────────────────────────────────────

export interface NewClipSubmittedData {
  ownerName: string;
  clipperName: string;
  campaignTitle: string;
  campaignId: string;
}

export function newClipSubmittedTemplate(data: NewClipSubmittedData): { subject: string; html: string } {
  const reviewUrl = `https://duta.val.id/dashboard/campaigns/${data.campaignId}/clips`;

  const html = wrapInBase(`
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #f5f5f5;">
      Ada clip baru masuk! 📥
    </h1>
    <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px 0;">
      Hei <strong style="color: #f5f5f5;">${data.ownerName}</strong>,
    </p>
    <p style="color: #f5f5f5; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
      <strong style="color: #7c3aed;">${data.clipperName}</strong> baru saja mengirimkan clip untuk kampanye kamu:
    </p>
    <div style="background: #1a1a1a; border: 1px solid #2e2e2e; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <p style="color: #a0a0a0; font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">Kampanye</p>
      <p style="font-size: 18px; font-weight: 600; color: #f5f5f5; margin: 0;">${data.campaignTitle}</p>
    </div>
    <p style="color: #f5f5f5; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      Segera review clip tersebut dan berikan keputusan — setujui atau tolak dengan feedback.
    </p>
    ${ctaButton('Review Clip Sekarang', reviewUrl)}
  `);

  return {
    subject: `Clip baru untuk ${data.campaignTitle}`,
    html,
  };
}
