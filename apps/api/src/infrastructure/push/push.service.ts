import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import type { PushSubscription } from 'web-push';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly initialized: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const vapidPublic = this.configService.get<string>('VAPID_PUBLIC_KEY') || '';
    const vapidPrivate = this.configService.get<string>('VAPID_PRIVATE_KEY') || '';

    if (!vapidPublic || !vapidPrivate) {
      this.logger.warn('VAPID keys not set — push notifications in mock mode');
      return;
    }

    webpush.setVapidDetails(
      'mailto:noreply@enamdua.id',
      vapidPublic,
      vapidPrivate,
    );
    this.initialized = true;
    this.logger.log('Web Push initialized with VAPID keys');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getVapidPublicKey(): string | undefined {
    return this.configService.get<string>('VAPID_PUBLIC_KEY');
  }

  async sendNotification(subscription: PushSubscription, payload: PushPayload): Promise<void> {
    if (!this.initialized) {
      this.logger.debug(`[mock] Push notification: ${payload.title} — ${payload.body}`);
      return;
    }

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error}`);
      throw error;
    }
  }

  async sendNotificationToEndpoint(
    endpoint: string,
    p256dh: string,
    auth: string,
    payload: PushPayload,
  ): Promise<void> {
    return this.sendNotification({ endpoint, keys: { p256dh, auth } }, payload);
  }
}
