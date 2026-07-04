import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql } from 'drizzle-orm';
import { customers } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers);

    const data = await this.db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findById(id: string) {
    const [customer] = await this.db.select().from(customers).where(eq(customers.id, id));
    return customer || null;
  }

  async create(data: any, createdBy?: string) {
    const [customer] = await this.db
      .insert(customers)
      .values({ ...data, createdBy })
      .returning();
    return customer;
  }

  async update(id: string, data: any) {
    const [updated] = await this.db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Customer not found');
    return updated;
  }

  async delete(id: string) {
    await this.db.delete(customers).where(eq(customers.id, id));
  }

  async search(term: string) {
    return this.db
      .select()
      .from(customers)
      .where(sql`${customers.fullName} ILIKE ${'%' + term + '%'} OR ${customers.phone} ILIKE ${'%' + term + '%'}`)
      .limit(20);
  }

  async findAllForExport() {
    return this.db
      .select({
        id: customers.id,
        fullName: customers.fullName,
        phone: customers.phone,
        email: customers.email,
        address: customers.address,
        tinNumber: customers.tinNumber,
        notes: customers.notes,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .orderBy(desc(customers.createdAt));
  }
}
