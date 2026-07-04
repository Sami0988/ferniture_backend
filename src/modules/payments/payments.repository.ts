import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and } from 'drizzle-orm';
import { payments, invoices, customers, projects } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findById(id: string) {
    const [payment] = await this.db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        method: payments.method,
        referenceNumber: payments.referenceNumber,
        paidAt: payments.paidAt,
        verifiedBy: payments.verifiedBy,
        verifiedAt: payments.verifiedAt,
        createdAt: payments.createdAt,
        invoiceNumber: invoices.invoiceNumber,
        customerName: customers.fullName,
        projectNumber: projects.projectNumber,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .where(eq(payments.id, id));

    return payment || null;
  }

  async findAll(pagination: PaginationDto, filters?: { method?: string; invoiceId?: string }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.method) conditions.push(eq(payments.method, filters.method as any));
    if (filters?.invoiceId) conditions.push(eq(payments.invoiceId, filters.invoiceId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(where as any);

    const data = await this.db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        method: payments.method,
        referenceNumber: payments.referenceNumber,
        paidAt: payments.paidAt,
        verifiedBy: payments.verifiedBy,
        createdAt: payments.createdAt,
        invoiceNumber: invoices.invoiceNumber,
        customerName: customers.fullName,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(where)
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async create(data: {
    invoiceId: string;
    amount: number;
    method: string;
    referenceNumber?: string;
    paidAt: string;
    verifiedBy?: string;
  }) {
    const [invoice] = await this.db.select().from(invoices).where(eq(invoices.id, data.invoiceId));
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.db.transaction(async (tx: any) => {
      const [payment] = await tx
        .insert(payments)
        .values({
          invoiceId: data.invoiceId,
          amount: String(data.amount),
          method: data.method as any,
          referenceNumber: data.referenceNumber,
          paidAt: new Date(data.paidAt),
          verifiedBy: data.verifiedBy,
        })
        .returning();

      // Update invoice payment status
      const [totalPaidResult] = await tx
        .select({ total: sql<number>`COALESCE(sum(amount::numeric), 0)::numeric` })
        .from(payments)
        .where(eq(payments.invoiceId, data.invoiceId));

      const totalPaid = Number(totalPaidResult.total);
      const totalAmount = Number(invoice.totalAmount);

      let paymentStatus: string = 'unpaid';
      if (totalPaid >= totalAmount) paymentStatus = 'paid';
      else if (totalPaid > 0) paymentStatus = 'partial';

      await tx
        .update(invoices)
        .set({ paymentStatus: paymentStatus as any })
        .where(eq(invoices.id, data.invoiceId));

      return this.findById(payment.id);
    });
  }

  async verify(id: string, verifiedBy: string) {
    const [updated] = await this.db
      .update(payments)
      .set({ verifiedBy, verifiedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Payment not found');
    return this.findById(id);
  }

  async delete(id: string) {
    await this.db.delete(payments).where(eq(payments.id, id));
  }

  async getTotalByInvoice(invoiceId: string): Promise<number> {
    const [result] = await this.db
      .select({ total: sql<number>`COALESCE(sum(amount::numeric), 0)::numeric` })
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));
    return Number(result.total);
  }
}
