import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/drizzle.module';
import { eq, and, gte, lt } from 'drizzle-orm';
import { projects, payments, invoices, users, customers } from '../database/schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class DailyDigestProcessor {
  private readonly logger = new Logger(DailyDigestProcessor.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async sendDailyDigest() {
    this.logger.log('Generating daily digest...');

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Get admins/managers
    const admins = await this.db
      .select()
      .from(users)
      .where(eq(users.role, 'super_admin'));

    // Overdue projects
    const overdueProjects = await this.db
      .select({
        title: projects.title,
        projectNumber: projects.projectNumber,
        deliveryDate: projects.deliveryDate,
      })
      .from(projects)
      .where(
        and(
          lt(projects.deliveryDate, today),
          eq(projects.status, 'in_progress'),
        ),
      );

    // Recent payments
    const recentPayments = await this.db
      .select({
        invoiceNumber: invoices.invoiceNumber,
        amount: payments.amount,
        customerName: customers.fullName,
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(gte(payments.createdAt, new Date(yesterday)));

    // New projects
    const newProjects = await this.db
      .select({
        title: projects.title,
        projectNumber: projects.projectNumber,
      })
      .from(projects)
      .where(gte(projects.createdAt, new Date(yesterday)));

    // Send to each admin
    for (const admin of admins) {
      if (admin.email) {
        await this.mailService.sendDailyDigest(admin.email, {
          userName: admin.fullName,
          overdueProjects,
          recentPayments,
          newProjects,
        });
      }
    }

    this.logger.log(`Daily digest sent to ${admins.length} admins`);
  }
}
