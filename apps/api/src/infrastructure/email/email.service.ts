import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
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
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.from = this.configService.get<string>('RESEND_FROM') || 'Duta <noreply@duta.val.id>';

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured — email service running in mock mode');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${JSON.stringify(error)}`);
      throw new Error(`Email send failed: ${error.message}`);
    }

    this.logger.log(`Email sent to ${to} — "${subject}"`);
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
