import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and, ilike } from 'drizzle-orm';
import { suppliers } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll(
    pagination: PaginationDto,
    filters?: { search?: string },
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.search) {
      const search = `%${filters.search}%`;
      conditions.push(
        sql`(${suppliers.companyName} ILIKE ${search} OR ${suppliers.tinNumber} ILIKE ${search})`,
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(suppliers)
      .where(where as any);

    const data = await this.db
      .select()
      .from(suppliers)
      .where(where as any)
      .orderBy(desc(suppliers.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findById(id: string) {
    const [supplier] = await this.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id));
    return supplier || null;
  }

  async findByTinNumber(tinNumber: string) {
    const [supplier] = await this.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.tinNumber, tinNumber));
    return supplier || null;
  }

  async create(data: any) {
    const [supplier] = await this.db
      .insert(suppliers)
      .values(data)
      .returning();
    return supplier;
  }

  async update(id: string, data: any) {
    const [updated] = await this.db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: string) {
    await this.db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async search(term: string) {
    return this.db
      .select()
      .from(suppliers)
      .where(
        sql`${suppliers.companyName} ILIKE ${'%' + term + '%'} OR ${suppliers.tinNumber} ILIKE ${'%' + term + '%'}`,
      )
      .limit(20);
  }
}
