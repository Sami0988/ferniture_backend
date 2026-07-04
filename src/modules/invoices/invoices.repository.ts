import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { invoices, invoiceItems, payments, customers, projects } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class InvoicesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(gte(invoices.createdAt, new Date(`${year}-01-01`)));

    const seq = String((result.count || 0) + 1).padStart(4, '0');
    return `INV-${year}-${seq}`;
  }

  async create(data: {
    projectId: string;
    customerId: string;
    items: { description: string; quantity: number; unitPrice: number }[];
    discountAmount?: number;
    vatRate?: number;
    createdBy?: string;
  }) {
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = data.discountAmount || 0;
    const vatRate = data.vatRate || 15;
    const taxableAmount = subtotal - discount;
    const vatAmount = taxableAmount * (vatRate / 100);
    const totalAmount = taxableAmount + vatAmount;

    const invoiceNumber = await this.generateInvoiceNumber();

    return this.db.transaction(async (tx: any) => {
      const [invoice] = await tx
        .insert(invoices)
        .values({
          invoiceNumber,
          projectId: data.projectId,
          customerId: data.customerId,
          subtotal: String(subtotal),
          discountAmount: String(discount),
          vatRate: String(vatRate),
          vatAmount: String(vatAmount),
          totalAmount: String(totalAmount),
          createdBy: data.createdBy,
        })
        .returning();

      if (data.items.length > 0) {
        await tx.insert(invoiceItems).values(
          data.items.map((item) => ({
            invoiceId: invoice.id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            total: String(item.quantity * item.unitPrice),
          })),
        );
      }

      return this.findById(invoice.id);
    });
  }

  async findById(id: string) {
    const [invoice] = await this.db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        projectId: invoices.projectId,
        customerId: invoices.customerId,
        subtotal: invoices.subtotal,
        discountAmount: invoices.discountAmount,
        vatRate: invoices.vatRate,
        vatAmount: invoices.vatAmount,
        totalAmount: invoices.totalAmount,
        paymentStatus: invoices.paymentStatus,
        pdfUrl: invoices.pdfUrl,
        createdBy: invoices.createdBy,
        createdAt: invoices.createdAt,
        customerName: customers.fullName,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        projectTitle: projects.title,
        projectNumber: projects.projectNumber,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .where(eq(invoices.id, id));

    if (!invoice) return null;

    const items = await this.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    const paymentList = await this.db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, id))
      .orderBy(desc(payments.paidAt));

    const totalPaid = paymentList.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    return {
      ...invoice,
      items,
      payments: paymentList,
      totalPaid: String(totalPaid),
      balanceDue: String(Number(invoice.totalAmount) - totalPaid),
    };
  }

  async findAll(pagination: PaginationDto, filters?: { paymentStatus?: string }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.paymentStatus) conditions.push(eq(invoices.paymentStatus, filters.paymentStatus as any));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(where as any);

    const data = await this.db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        paymentStatus: invoices.paymentStatus,
        createdAt: invoices.createdAt,
        customerName: customers.fullName,
        projectNumber: projects.projectNumber,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .where(where)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async addPayment(invoiceId: string, data: {
    amount: number;
    method: string;
    referenceNumber?: string;
    paidAt: string;
    verifiedBy?: string;
  }) {
    const [invoice] = await this.db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.db.transaction(async (tx: any) => {
      const [payment] = await tx
        .insert(payments)
        .values({
          invoiceId,
          amount: String(data.amount),
          method: data.method as any,
          referenceNumber: data.referenceNumber,
          paidAt: new Date(data.paidAt),
          verifiedBy: data.verifiedBy,
        })
        .returning();

      // Calculate total paid and update invoice status
      const [totalPaidResult] = await tx
        .select({ total: sql<number>`COALESCE(sum(amount::numeric), 0)::numeric` })
        .from(payments)
        .where(eq(payments.invoiceId, invoiceId));

      const totalPaid = Number(totalPaidResult.total);
      const totalAmount = Number(invoice.totalAmount);

      let paymentStatus: string = 'unpaid';
      if (totalPaid >= totalAmount) paymentStatus = 'paid';
      else if (totalPaid > 0) paymentStatus = 'partial';

      await tx
        .update(invoices)
        .set({ paymentStatus: paymentStatus as any })
        .where(eq(invoices.id, invoiceId));

      return payment;
    });
  }

  async updatePdfUrl(id: string, pdfUrl: string) {
    await this.db.update(invoices).set({ pdfUrl }).where(eq(invoices.id, id));
  }

  async getPayments(invoiceId: string) {
    return this.db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.paidAt));
  }

  async delete(id: string) {
    await this.db.delete(payments).where(eq(payments.invoiceId, id));
    await this.db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await this.db.delete(invoices).where(eq(invoices.id, id));
  }

  async update(id: string, data: any) {
    const [updated] = await this.db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Invoice not found');
    return this.findById(id);
  }

  async updateItems(invoiceId: string, items: { description: string; quantity: number; unitPrice: number }[]) {
    // Delete existing items
    await this.db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

    // Insert new items
    if (items.length > 0) {
      await this.db.insert(invoiceItems).values(
        items.map((item) => ({
          invoiceId,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          total: String(item.quantity * item.unitPrice),
        })),
      );
    }

    // Recalculate totals
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const [invoice] = await this.db.select().from(invoices).where(eq(invoices.id, invoiceId));
    const discount = Number(invoice.discountAmount || 0);
    const vatRate = Number(invoice.vatRate || 15);
    const taxableAmount = subtotal - discount;
    const vatAmount = taxableAmount * (vatRate / 100);
    const totalAmount = taxableAmount + vatAmount;

    await this.db
      .update(invoices)
      .set({
        subtotal: String(subtotal),
        vatAmount: String(vatAmount),
        totalAmount: String(totalAmount),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    return this.findById(invoiceId);
  }
}
