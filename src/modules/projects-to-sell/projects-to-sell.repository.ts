import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and, ilike } from 'drizzle-orm';
import { projectsToSell } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectsToSellRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll(pagination: PaginationDto, filters?: { division?: string; type?: string; search?: string }): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.division) conditions.push(eq(projectsToSell.division, filters.division as any));
    if (filters?.type) conditions.push(eq(projectsToSell.type, filters.type));
    if (filters?.search) conditions.push(ilike(projectsToSell.name, `%${filters.search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectsToSell)
      .where(where as any);

    const data = await this.db
      .select()
      .from(projectsToSell)
      .where(where as any)
      .orderBy(desc(projectsToSell.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findPublic(division?: string): Promise<any[]> {
    const conditions: any[] = [eq(projectsToSell.isActive, true)];
    if (division) conditions.push(eq(projectsToSell.division, division as any));
    return this.db
      .select()
      .from(projectsToSell)
      .where(and(...conditions))
      .orderBy(desc(projectsToSell.createdAt));
  }

  async findPublicPaginated(page: number = 1, limit: number = 20, division?: string): Promise<{ data: any[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: any[] = [eq(projectsToSell.isActive, true)];
    if (division) conditions.push(eq(projectsToSell.division, division as any));
    const where = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectsToSell)
      .where(where);

    const data = await this.db
      .select()
      .from(projectsToSell)
      .where(where)
      .orderBy(desc(projectsToSell.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: countResult.count };
  }

  async findById(id: string) {
    const [item] = await this.db.select().from(projectsToSell).where(eq(projectsToSell.id, id));
    return item || null;
  }

  async create(data: any) {
    const [item] = await this.db.insert(projectsToSell).values(data).returning();
    return item;
  }

  async update(id: string, data: any) {
    const [updated] = await this.db
      .update(projectsToSell)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projectsToSell.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Item not found');
    return updated;
  }

  async delete(id: string) {
    await this.db.delete(projectsToSell).where(eq(projectsToSell.id, id));
  }
}
