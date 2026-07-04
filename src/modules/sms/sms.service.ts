import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly username: string;
  private readonly from: string;
  private readonly baseUrl = 'https://api.africastalking.com/version1/messaging';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('app.africastalking.apiKey') || '';
    this.username = this.configService.get<string>('app.africastalking.username') || '';
    this.from = this.configService.get<string>('app.africastalking.from') || '';
  }

  private get isEnabled(): boolean {
    return Boolean(this.apiKey && this.username);
  }

  async sendSms(to: string, message: string): Promise<SmsResponse> {
    if (!this.isEnabled) {
      this.logger.warn('Africa\'s Talking SMS not configured — skipping send');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const params = new URLSearchParams();
      params.append('username', this.username);
      params.append('to', to);
      params.append('message', message);
      if (this.from) {
        params.append('from', this.from);
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'apiKey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        this.logger.error(`SMS failed: ${JSON.stringify(data)}`);
        return { success: false, error: data.Message || 'SMS send failed' };
      }

      const messageId = data.SMSMessageData?.Recipients?.[0]?.messageId;
      this.logger.log(`SMS sent to ${to}: ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      this.logger.error(`SMS error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendOrderConfirmation(phone: string, projectNumber: string, projectTitle: string): Promise<SmsResponse> {
    const message = `Kassahun Wood & Aluminum Work: Your order ${projectNumber} (${projectTitle}) has been received. We'll contact you soon.`;
    return this.sendSms(phone, message);
  }

  async sendJobCompleted(phone: string, projectNumber: string, projectTitle: string): Promise<SmsResponse> {
    const message = `Kassahun Wood & Aluminum Work: Your order ${projectNumber} (${projectTitle}) is ready for delivery/pickup. Please contact us to arrange.`;
    return this.sendSms(phone, message);
  }

  async sendPaymentReceived(phone: string, invoiceNumber: string, amount: string): Promise<SmsResponse> {
    const message = `Kassahun Wood & Aluminum Work: Payment of ${amount} ETB received for invoice ${invoiceNumber}. Thank you!`;
    return this.sendSms(phone, message);
  }

  async sendOtp(phone: string, otp: string): Promise<SmsResponse> {
    const message = `Kassahun Wood & Aluminum Work: Your verification code is ${otp}. It expires in 10 minutes.`;
    return this.sendSms(phone, message);
  }

  async sendDeliveryReminder(phone: string, projectNumber: string, deliveryDate: string): Promise<SmsResponse> {
    const message = `Kassahun Wood & Aluminum Work: Reminder — order ${projectNumber} is scheduled for delivery on ${deliveryDate}.`;
    return this.sendSms(phone, message);
  }
}
