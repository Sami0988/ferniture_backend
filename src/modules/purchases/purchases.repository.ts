import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { purchases, purchaseItems, suppliers } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PurchasesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll(
    pagination: PaginationDto,
    filters?: { supplierId?: string; from?: string; to?: string },
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.supplierId) {
      conditions.push(eq(purchases.supplierId, filters.supplierId));
    }
    if (filters?.from) {
      conditions.push(gte(purchases.purchaseDate, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(purchases.purchaseDate, filters.to));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(purchases)
      .where(where as any);

    const data = await this.db
      .select({
        id: purchases.id,
        supplierId: purchases.supplierId,
        fsNumber: purchases.fsNumber,
        bankTransactionNumber: purchases.bankTransactionNumber,
        purchaseDate: purchases.purchaseDate,
        amountBeforeVat: purchases.amountBeforeVat,
        vatAmount: purchases.vatAmount,
        withholdingAmount: purchases.withholdingAmount,
        totalAmount: purchases.totalAmount,
        createdBy: purchases.createdBy,
        createdAt: purchases.createdAt,
        updatedAt: purchases.updatedAt,
        supplierName: suppliers.companyName,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(where as any)
      .orderBy(desc(purchases.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findById(id: string) {
    const [purchase] = await this.db
      .select({
        id: purchases.id,
        supplierId: purchases.supplierId,
        fsNumber: purchases.fsNumber,
        bankTransactionNumber: purchases.bankTransactionNumber,
        purchaseDate: purchases.purchaseDate,
        amountBeforeVat: purchases.amountBeforeVat,
        vatAmount: purchases.vatAmount,
        withholdingAmount: purchases.withholdingAmount,
        totalAmount: purchases.totalAmount,
        createdBy: purchases.createdBy,
        createdAt: purchases.createdAt,
        updatedAt: purchases.updatedAt,
        supplierName: suppliers.companyName,
        supplierTin: suppliers.tinNumber,
        supplierPhone: suppliers.phone,
        supplierAddress: suppliers.address,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(eq(purchases.id, id));

    if (!purchase) return null;

    const items = await this.db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, id));

    return { ...purchase, items };
  }

  async create(purchaseData: any, itemsData: any[]) {
    return this.db.transaction(async (tx: any) => {
      const [purchase] = await tx
        .insert(purchases)
        .values(purchaseData)
        .returning();

      if (itemsData.length > 0) {
        const itemsWithPurchaseId = itemsData.map((item) => ({
          ...item,
          purchaseId: purchase.id,
        }));
        await tx.insert(purchaseItems).values(itemsWithPurchaseId);
      }

      return purchase;
    });
  }

  async update(id: string, purchaseData: any, itemsData?: any[]) {
    return this.db.transaction(async (tx: any) => {
      const [updated] = await tx
        .update(purchases)
        .set({ ...purchaseData, updatedAt: new Date() })
        .where(eq(purchases.id, id))
        .returning();

      if (itemsData !== undefined) {
        await tx
          .delete(purchaseItems)
          .where(eq(purchaseItems.purchaseId, id));

        if (itemsData.length > 0) {
          const itemsWithPurchaseId = itemsData.map((item) => ({
            ...item,
            purchaseId: id,
          }));
          await tx.insert(purchaseItems).values(itemsWithPurchaseId);
        }
      }

      return updated;
    });
  }

  async delete(id: string) {
    await this.db.delete(purchases).where(eq(purchases.id, id));
  }

  async countBySupplierId(supplierId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(purchases)
      .where(eq(purchases.supplierId, supplierId));
    return result?.count || 0;
  }

  async aggregateByDateRange(from: Date, to: Date) {
    const fromDate = from.toISOString().split('T')[0];
    const toDate = to.toISOString().split('T')[0];

    const [result] = await this.db
      .select({
        totalAmountBeforeVat: sql<string>`coalesce(sum(${purchases.amountBeforeVat}::numeric), 0)`,
        totalVat: sql<string>`coalesce(sum(${purchases.vatAmount}::numeric), 0)`,
        totalWithholding: sql<string>`coalesce(sum(${purchases.withholdingAmount}::numeric), 0)`,
        totalCount: sql<number>`count(*)::int`,
      })
      .from(purchases)
      .where(
        and(
          gte(purchases.purchaseDate, fromDate),
          lte(purchases.purchaseDate, toDate),
        ),
      );

    return result;
  }
}
