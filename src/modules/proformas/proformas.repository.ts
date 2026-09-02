import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and } from 'drizzle-orm';
import {
  proformas,
  proformaItems,
  projects,
  customers,
} from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProformasRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async generateProformaNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(proformas)
      .where(sql`EXTRACT(YEAR FROM ${proformas.createdAt}) = ${year}`);

    const seq = String((result.count || 0) + 1).padStart(6, '0');
    return `KK-PF-${year}-${seq}`;
  }

  private computeTotals(
    items: { quantity: number; unitPrice: number }[],
    discountAmount: number,
    vatRate: number,
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = afterDiscount * (vatRate / 100);
    const totalAmount = afterDiscount + vatAmount;
    return {
      subtotal: String(subtotal.toFixed(2)),
      vatAmount: String(vatAmount.toFixed(2)),
      totalAmount: String(totalAmount.toFixed(2)),
    };
  }

  async create(data: {
    projectId?: string;
    customerId?: string;
    billedToName: string;
    billedToAddress?: string;
    billedToPhone?: string;
    billedToTin?: string;
    subject?: string;
    notes?: string;
    validityDays?: number;
    materialSummary?: string;
    discountAmount?: number;
    vatRate?: number;
    items: {
      description: string;
      category?: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
    }[];
    createdBy: string;
  }) {
    const proformaNumber = await this.generateProformaNumber();
    const vatRate = data.vatRate ?? 15;
    const discountAmount = data.discountAmount ?? 0;
    const totals = this.computeTotals(data.items, discountAmount, vatRate);

    const [proforma] = await this.db
      .insert(proformas)
      .values({
        proformaNumber,
        projectId: data.projectId || null,
        customerId: data.customerId || null,
        billedToName: data.billedToName,
        billedToAddress: data.billedToAddress || null,
        billedToPhone: data.billedToPhone || null,
        billedToTin: data.billedToTin || null,
        subject: data.subject || null,
        notes: data.notes || null,
        validityDays: data.validityDays ?? 7,
        materialSummary: data.materialSummary || null,
        subtotal: totals.subtotal,
        discountAmount: String(discountAmount),
        vatRate: String(vatRate),
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        status: 'draft',
        createdBy: data.createdBy,
      })
      .returning();

    if (data.items?.length) {
      await this.db.insert(proformaItems).values(
        data.items.map((item, idx) => ({
          proformaId: proforma.id,
          description: item.description,
          category: item.category || null,
          quantity: String(item.quantity),
          unit: (item.unit as any) || 'PCS',
          unitPrice: String(item.unitPrice),
          total: String((item.quantity * item.unitPrice).toFixed(2)),
          sortOrder: idx,
        })),
      );
    }

    return this.findById(proforma.id);
  }

  async findById(id: string) {
    const [proforma] = await this.db
      .select({
        id: proformas.id,
        proformaNumber: proformas.proformaNumber,
        projectId: proformas.projectId,
        customerId: proformas.customerId,
        billedToName: proformas.billedToName,
        billedToAddress: proformas.billedToAddress,
        billedToPhone: proformas.billedToPhone,
        billedToTin: proformas.billedToTin,
        subject: proformas.subject,
        notes: proformas.notes,
        validityDays: proformas.validityDays,
        materialSummary: proformas.materialSummary,
        subtotal: proformas.subtotal,
        discountAmount: proformas.discountAmount,
        vatRate: proformas.vatRate,
        vatAmount: proformas.vatAmount,
        totalAmount: proformas.totalAmount,
        status: proformas.status,
        pdfUrl: proformas.pdfUrl,
        createdBy: proformas.createdBy,
        createdAt: proformas.createdAt,
        updatedAt: proformas.updatedAt,
        projectNumber: projects.projectNumber,
        projectTitle: projects.title,
        customerName: customers.fullName,
        customerPhone: customers.phone,
        customerEmail: customers.email,
      })
      .from(proformas)
      .leftJoin(projects, eq(proformas.projectId, projects.id))
      .leftJoin(customers, eq(proformas.customerId, customers.id))
      .where(eq(proformas.id, id));

    if (!proforma) return null;

    const items = await this.db
      .select()
      .from(proformaItems)
      .where(eq(proformaItems.proformaId, id))
      .orderBy(proformaItems.sortOrder);

    // Compute expired status on read
    let effectiveStatus = proforma.status;
    if (proforma.status === 'sent' && proforma.validityDays) {
      const createdAt = new Date(proforma.createdAt);
      const expiryDate = new Date(createdAt);
      expiryDate.setDate(expiryDate.getDate() + proforma.validityDays);
      if (new Date() > expiryDate) {
        effectiveStatus = 'expired';
      }
    }

    return { ...proforma, status: effectiveStatus, items };
  }

  async findAll(
    pagination: PaginationDto,
    filters?: { projectId?: string; customerId?: string; status?: string },
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.projectId) conditions.push(eq(proformas.projectId, filters.projectId));
    if (filters?.customerId) conditions.push(eq(proformas.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(proformas.status, filters.status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(proformas)
      .leftJoin(customers, eq(proformas.customerId, customers.id))
      .where(where as any);

    const data = await this.db
      .select({
        id: proformas.id,
        proformaNumber: proformas.proformaNumber,
        projectId: proformas.projectId,
        customerId: proformas.customerId,
        billedToName: proformas.billedToName,
        subject: proformas.subject,
        materialSummary: proformas.materialSummary,
        totalAmount: proformas.totalAmount,
        status: proformas.status,
        validityDays: proformas.validityDays,
        pdfUrl: proformas.pdfUrl,
        createdAt: proformas.createdAt,
        projectNumber: projects.projectNumber,
        projectTitle: projects.title,
        customerName: customers.fullName,
      })
      .from(proformas)
      .leftJoin(projects, eq(proformas.projectId, projects.id))
      .leftJoin(customers, eq(proformas.customerId, customers.id))
      .where(where)
      .orderBy(desc(proformas.createdAt))
      .limit(limit)
      .offset(offset);

    // Compute expired status for list items
    const now = new Date();
    const enrichedData = data.map((row) => {
      let effectiveStatus = row.status;
      if (row.status === 'sent' && row.validityDays) {
        const createdAt = new Date(row.createdAt);
        const expiryDate = new Date(createdAt);
        expiryDate.setDate(expiryDate.getDate() + row.validityDays);
        if (now > expiryDate) {
          effectiveStatus = 'expired';
        }
      }
      return { ...row, status: effectiveStatus };
    });

    // If filtering by expired, apply in-memory filter
    let filteredData = enrichedData;
    if (filters?.status === 'expired') {
      filteredData = enrichedData.filter((r) => r.status === 'expired');
    } else if (filters?.status) {
      filteredData = enrichedData.filter((r) => r.status === filters.status);
    }

    return new PaginatedResult(filteredData, countResult.count, page, limit);
  }

  async updatePdfUrl(id: string, pdfUrl: string) {
    await this.db
      .update(proformas)
      .set({ pdfUrl, updatedAt: new Date() })
      .where(eq(proformas.id, id));
  }

  async update(id: string, data: {
    projectId?: string;
    customerId?: string;
    billedToName?: string;
    billedToAddress?: string;
    billedToPhone?: string;
    billedToTin?: string;
    subject?: string;
    notes?: string;
    validityDays?: number;
    materialSummary?: string;
    discountAmount?: number;
    vatRate?: number;
    items?: {
      description: string;
      category?: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
    }[];
  }) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Proforma not found');

    if (existing.status !== 'draft' && data.items) {
      throw new ConflictException('Cannot edit proforma items after it has been sent');
    }

    // If items are being updated, recompute totals
    let updateData: any = { ...data, updatedAt: new Date() };
    if (data.items) {
      const vatRate = data.vatRate ?? Number(existing.vatRate);
      const discountAmount = data.discountAmount ?? Number(existing.discountAmount);
      const totals = this.computeTotals(data.items, discountAmount, vatRate);
      updateData = { ...updateData, ...totals };
    } else if (data.discountAmount !== undefined || data.vatRate !== undefined) {
      const items = existing.items || [];
      const vatRate = data.vatRate ?? Number(existing.vatRate);
      const discountAmount = data.discountAmount ?? Number(existing.discountAmount);
      const totals = this.computeTotals(
        items.map((i: any) => ({ quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        discountAmount,
        vatRate,
      );
      updateData = { ...updateData, ...totals };
    }

    // Remove items from top-level update (handled separately)
    const { items, ...fieldsToUpdate } = updateData;

    await this.db
      .update(proformas)
      .set(fieldsToUpdate)
      .where(eq(proformas.id, id));

    // Replace items if provided
    if (data.items) {
      await this.db
        .delete(proformaItems)
        .where(eq(proformaItems.proformaId, id));

      if (data.items.length > 0) {
        await this.db.insert(proformaItems).values(
          data.items.map((item, idx) => ({
            proformaId: id,
            description: item.description,
            category: item.category || null,
            quantity: String(item.quantity),
            unit: (item.unit as any) || 'PCS',
            unitPrice: String(item.unitPrice),
            total: String((item.quantity * item.unitPrice).toFixed(2)),
            sortOrder: idx,
          })),
        );
      }
    }

    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Proforma not found');

    const allowedTransitions: Record<string, string[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['accepted', 'cancelled'],
    };

    const currentStatus = existing.status === 'expired' ? 'sent' : existing.status;
    const allowed = allowedTransitions[currentStatus];
    if (!allowed || !allowed.includes(status)) {
      throw new ConflictException(
        `Cannot transition from "${existing.status}" to "${status}"`,
      );
    }

    await this.db
      .update(proformas)
      .set({ status, updatedAt: new Date() })
      .where(eq(proformas.id, id));

    return this.findById(id);
  }

  async delete(id: string) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Proforma not found');
    if (existing.status !== 'draft') {
      throw new ConflictException('Only draft proformas can be deleted');
    }

    await this.db.delete(proformaItems).where(eq(proformaItems.proformaId, id));
    await this.db.delete(proformas).where(eq(proformas.id, id));
  }
}
