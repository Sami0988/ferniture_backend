import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql } from 'drizzle-orm';
import { projects, projectPayments, invoices, payments } from '../../database/schema';

@Injectable()
export class ProjectPaymentsService {
  private readonly logger = new Logger(ProjectPaymentsService.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async getPaymentSummary(projectId: string) {
    const [project] = await this.db
      .select({
        totalPrice: projects.totalPrice,
        paidNowPrice: projects.paidNowPrice,
      })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) throw new NotFoundException('Project not found');

    const payments = await this.db
      .select()
      .from(projectPayments)
      .where(eq(projectPayments.projectId, projectId))
      .orderBy(desc(projectPayments.createdAt));

    const totalPaid = (project.paidNowPrice || 0) + payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const totalPrice = project.totalPrice || 0;
    const remaining = totalPrice - totalPaid;

    return {
      totalPrice,
      paidNowPrice: project.paidNowPrice || 0,
      totalPaid,
      remaining: remaining < 0 ? 0 : remaining,
      overpaid: remaining < 0 ? Math.abs(remaining) : 0,
      payments,
    };
  }

  async addPayment(projectId: string, data: { amount: number; method: string; note?: string }, recordedBy: string) {
    if (data.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) throw new NotFoundException('Project not found');

    const payments = await this.db
      .select()
      .from(projectPayments)
      .where(eq(projectPayments.projectId, projectId));

    const totalPaid = (project.paidNowPrice || 0) + payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const remaining = (project.totalPrice || 0) - totalPaid;

    if (remaining <= 0 && data.amount > 0) {
      throw new BadRequestException(`Project is already fully paid. Remaining: 0`);
    }

    // Record the payment
    const [payment] = await this.db
      .insert(projectPayments)
      .values({
        projectId,
        amount: data.amount,
        method: data.method as any,
        note: data.note,
        recordedBy,
      })
      .returning();

    // Recalculate totals after payment
    const newTotalPaid = totalPaid + data.amount;
    const newRemaining = (project.totalPrice || 0) - newTotalPaid;

    // Auto-update status to 'paid' if fully settled
    let newStatus = project.status;
    if (newRemaining <= 0 && project.status !== 'paid') {
      newStatus = 'paid';
      await this.db
        .update(projects)
        .set({
          paidNowPrice: project.totalPrice || 0,
          status: 'paid',
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      this.logger.log(`Project ${projectId} auto-marked as paid (fully settled)`);
    }

    // Sync payment to invoice if one exists for this project
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.projectId, projectId));

    let invoiceSynced = false;
    if (invoice) {
      // Add payment to invoice
      await this.db.insert(payments).values({
        invoiceId: invoice.id,
        amount: data.amount,
        method: data.method as any,
        paidAt: new Date(),
        verifiedBy: recordedBy,
      });

      // Recalculate invoice payment status
      const [totalPaidResult] = await this.db
        .select({ total: sql<number>`COALESCE(sum(amount::numeric), 0)::numeric` })
        .from(payments)
        .where(eq(payments.invoiceId, invoice.id));

      const invoiceTotalPaid = Number(totalPaidResult.total);
      const invoiceTotal = Number(invoice.totalAmount);

      let invoiceStatus: string = 'unpaid';
      if (invoiceTotalPaid >= invoiceTotal) invoiceStatus = 'paid';
      else if (invoiceTotalPaid > 0) invoiceStatus = 'partial';

      await this.db
        .update(invoices)
        .set({ paymentStatus: invoiceStatus as any })
        .where(eq(invoices.id, invoice.id));

      invoiceSynced = true;
      this.logger.log(`Payment synced to invoice ${invoice.invoiceNumber}`);
    }

    return {
      payment,
      summary: {
        totalPrice: project.totalPrice || 0,
        previousPaid: totalPaid,
        paymentAmount: data.amount,
        newTotalPaid: newTotalPaid,
        remaining: newRemaining < 0 ? 0 : newRemaining,
        overpaid: newRemaining < 0 ? Math.abs(newRemaining) : 0,
        statusChanged: newStatus !== project.status,
        newStatus,
        invoiceSynced,
        invoiceId: invoice?.id || null,
      },
    };
  }

  async getPayments(projectId: string) {
    return this.db
      .select()
      .from(projectPayments)
      .where(eq(projectPayments.projectId, projectId))
      .orderBy(desc(projectPayments.createdAt));
  }
}
