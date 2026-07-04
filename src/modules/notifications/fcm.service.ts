import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (this.initialized) return;

      const projectId = this.configService.get<string>('app.firebase.projectId');
      const privateKey = this.configService.get<string>('app.firebase.privateKey');
      const clientEmail = this.configService.get<string>('app.firebase.clientEmail');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('Firebase credentials not configured. Push notifications disabled.');
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
      });

      this.initialized = true;
      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }

  async sendToDevice(
    token: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      await admin.messaging().send({
        token,
        notification,
        data,
        android: { priority: 'high' },
        apns: { payload: { aps: { 'content-available': 1 } } },
      });
      return true;
    } catch (error: any) {
      if (error.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`Invalid FCM token: ${token}`);
      } else {
        this.logger.error(`FCM send failed: ${error.message}`);
      }
      return false;
    }
  }

  async sendToMultipleTokens(
    tokens: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<{ success: number; failed: number }> {
    if (!this.initialized || tokens.length === 0) {
      return { success: 0, failed: 0 };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification,
        data,
        android: { priority: 'high' },
      });

      return {
        success: response.successCount,
        failed: response.failureCount,
      };
    } catch (error) {
      this.logger.error(`FCM multicast failed: ${error}`);
      return { success: 0, failed: tokens.length };
    }
  }
}
