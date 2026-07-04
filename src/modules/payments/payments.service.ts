import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly repo: PaymentsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(pagination: PaginationDto, filters?: { method?: string; invoiceId?: string }): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination, filters);
  }

  async findById(id: string) {
    const payment = await this.repo.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async create(data: {
    invoiceId: string;
    amount: number;
    method: string;
    referenceNumber?: string;
    paidAt: string;
    verifiedBy?: string;
  }) {
    const payment = await this.repo.create(data);

    // Notify admins about new payment
    try {
      if (payment.invoiceNumber) {
        await this.notificationsService.notifyPaymentReceived(
          payment.invoiceNumber,
          `${data.amount} ETB`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send payment notification: ${error.message}`);
    }

    return payment;
  }

  async verify(id: string, verifiedBy: string) {
    const payment = await this.repo.verify(id, verifiedBy);

    // Notify verifier
    try {
      if (payment.invoiceNumber) {
        await this.notificationsService.notifyPaymentVerified(
          verifiedBy,
          payment.invoiceNumber,
          `${payment.amount} ETB`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send verification notification: ${error.message}`);
    }

    return payment;
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async getByInvoice(invoiceId: string) {
    return this.repo.findAll({ page: 1, limit: 100 }, { invoiceId });
  }
}
