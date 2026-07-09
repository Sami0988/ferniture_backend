import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and } from 'drizzle-orm';
import { paymentLetters, projects, customers, projectPayments } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentLettersRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async generateLetterNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentLetters)
      .where(sql`EXTRACT(YEAR FROM ${paymentLetters.createdAt}) = ${year}`);

    const seq = String((result.count || 0) + 1).padStart(4, '0');
    return `PL-${year}-${seq}`;
  }

  async create(data: {
    projectId: string;
    customerId?: string;
    templateId?: string;
    recipientCompanyName: string;
    recipientName?: string;
    recipientTitle?: string;
    recipientAddress?: string;
    subject: string;
    body: string;
    referenceNumber?: string;
    dueDate?: string;
    createdBy: string;
  }) {
    const letterNumber = await this.generateLetterNumber();

    const [letter] = await this.db
      .insert(paymentLetters)
      .values({
        letterNumber,
        projectId: data.projectId,
        customerId: data.customerId || null,
        templateId: data.templateId || null,
        recipientCompanyName: data.recipientCompanyName,
        recipientName: data.recipientName || null,
        recipientTitle: data.recipientTitle || null,
        recipientAddress: data.recipientAddress || null,
        subject: data.subject,
        body: data.body,
        referenceNumber: data.referenceNumber || null,
        dueDate: data.dueDate || null,
        status: 'draft',
        createdBy: data.createdBy,
      })
      .returning();

    return this.findById(letter.id);
  }

  async findById(id: string) {
    const [letter] = await this.db
      .select({
        id: paymentLetters.id,
        letterNumber: paymentLetters.letterNumber,
        projectId: paymentLetters.projectId,
        customerId: paymentLetters.customerId,
        templateId: paymentLetters.templateId,
        recipientCompanyName: paymentLetters.recipientCompanyName,
        recipientName: paymentLetters.recipientName,
        recipientTitle: paymentLetters.recipientTitle,
        recipientAddress: paymentLetters.recipientAddress,
        subject: paymentLetters.subject,
        body: paymentLetters.body,
        referenceNumber: paymentLetters.referenceNumber,
        dueDate: paymentLetters.dueDate,
        pdfUrl: paymentLetters.pdfUrl,
        status: paymentLetters.status,
        createdBy: paymentLetters.createdBy,
        createdAt: paymentLetters.createdAt,
        updatedAt: paymentLetters.updatedAt,
        projectTitle: projects.title,
        projectNumber: projects.projectNumber,
        projectName: projects.title,
        projectTotalPrice: projects.totalPrice,
        projectPaidNowPrice: projects.paidNowPrice,
        customerName: customers.fullName,
        customerPhone: customers.phone,
      })
      .from(paymentLetters)
      .leftJoin(projects, eq(paymentLetters.projectId, projects.id))
      .leftJoin(customers, eq(paymentLetters.customerId, customers.id))
      .where(eq(paymentLetters.id, id));

    if (!letter) return null;

    // Calculate additional payments from project_payments table
    const [extraPayments] = await this.db
      .select({ total: sql<number>`COALESCE(sum(amount), 0)` })
      .from(projectPayments)
      .where(eq(projectPayments.projectId, letter.projectId));

    const paidNow = Number(letter.projectPaidNowPrice || 0);
    const extraPaid = Number(extraPayments.total || 0);
    const totalPaid = paidNow + extraPaid;
    const totalPrice = Number(letter.projectTotalPrice || 0);
    const balanceDue = totalPrice - totalPaid;

    return {
      ...letter,
      projectTotalPrice: String(totalPrice),
      projectTotalPaid: String(totalPaid),
      projectBalanceDue: String(balanceDue),
    };
  }

  async findAll(
    pagination: PaginationDto,
    filters?: { projectId?: string; customerId?: string; status?: string },
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.projectId) conditions.push(eq(paymentLetters.projectId, filters.projectId));
    if (filters?.customerId) conditions.push(eq(paymentLetters.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(paymentLetters.status, filters.status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentLetters)
      .leftJoin(projects, eq(paymentLetters.projectId, projects.id))
      .leftJoin(customers, eq(paymentLetters.customerId, customers.id))
      .where(where as any);

    const data = await this.db
      .select({
        id: paymentLetters.id,
        letterNumber: paymentLetters.letterNumber,
        projectId: paymentLetters.projectId,
        customerId: paymentLetters.customerId,
        recipientCompanyName: paymentLetters.recipientCompanyName,
        subject: paymentLetters.subject,
        status: paymentLetters.status,
        pdfUrl: paymentLetters.pdfUrl,
        createdAt: paymentLetters.createdAt,
        projectNumber: projects.projectNumber,
        projectTitle: projects.title,
        customerName: customers.fullName,
      })
      .from(paymentLetters)
      .leftJoin(projects, eq(paymentLetters.projectId, projects.id))
      .leftJoin(customers, eq(paymentLetters.customerId, customers.id))
      .where(where)
      .orderBy(desc(paymentLetters.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async updatePdfUrl(id: string, pdfUrl: string) {
    await this.db
      .update(paymentLetters)
      .set({ pdfUrl, updatedAt: new Date() })
      .where(eq(paymentLetters.id, id));
  }

  async update(id: string, data: {
    recipientCompanyName?: string;
    recipientName?: string;
    recipientTitle?: string;
    recipientAddress?: string;
    subject?: string;
    body?: string;
    referenceNumber?: string;
    dueDate?: string;
    templateId?: string;
    status?: string;
  }) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Payment letter not found');

    if (existing.status !== 'draft' && (data.subject || data.body || data.recipientCompanyName || data.recipientName || data.recipientTitle || data.recipientAddress)) {
      throw new ConflictException('Cannot edit letter content after it has been sent');
    }

    const [updated] = await this.db
      .update(paymentLetters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentLetters.id, id))
      .returning();

    return this.findById(id);
  }

  async markAsSent(id: string) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Payment letter not found');
    if (existing.status !== 'draft') {
      throw new ConflictException('Only draft letters can be sent');
    }

    await this.db
      .update(paymentLetters)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(paymentLetters.id, id));

    return this.findById(id);
  }

  async delete(id: string) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Payment letter not found');
    if (existing.status !== 'draft') {
      throw new ConflictException('Only draft letters can be deleted');
    }

    await this.db.delete(paymentLetters).where(eq(paymentLetters.id, id));
  }
}
