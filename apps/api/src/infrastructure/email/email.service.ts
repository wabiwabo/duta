import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  welcomeTemplate,
  clipApprovedTemplate,
  clipRejectedTemplate,
  paymentReceivedTemplate,
  newClipSubmittedTemplate,
  type WelcomeData,
  type ClipApprovedData,
  type ClipRejectedData,
  type PaymentReceivedData,
  type NewClipSubmittedData,
} from './email-templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || '';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const user = this.configService.get<string>('SMTP_USER') || '';
    const pass = this.configService.get<string>('SMTP_PASS') || '';
    this.from = this.configService.get<string>('SMTP_FROM') || 'Duta <noreply@enamdua.id>';

    if (!host || !user || !pass) {
      this.logger.warn('SMTP credentials not configured — email service running in mock mode');
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Email service configured via SMTP ${host}:${port}`);
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} — "${subject}"`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
    }
  }

  async sendWelcome(to: string, data: WelcomeData): Promise<void> {
    const { subject, html } = welcomeTemplate(data);
    await this.send(to, subject, html);
  }

  async sendClipApproved(to: string, data: ClipApprovedData): Promise<void> {
    const { subject, html } = clipApprovedTemplate(data);
    await this.send(to, subject, html);
  }

  async sendClipRejected(to: string, data: ClipRejectedData): Promise<void> {
    const { subject, html } = clipRejectedTemplate(data);
    await this.send(to, subject, html);
  }

  async sendPaymentReceived(to: string, data: PaymentReceivedData): Promise<void> {
    const { subject, html } = paymentReceivedTemplate(data);
    await this.send(to, subject, html);
  }

  async sendNewClipSubmitted(to: string, data: NewClipSubmittedData): Promise<void> {
    const { subject, html } = newClipSubmittedTemplate(data);
    await this.send(to, subject, html);
  }
}
