import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and, ilike } from 'drizzle-orm';
import { customers, projects, invoices, payments } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll(pagination: PaginationDto, filters?: { type?: string; search?: string }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.type) conditions.push(eq(customers.type, filters.type as any));
    if (filters?.search) {
      const search = `%${filters.search}%`;
      conditions.push(
        sql`(${customers.fullName} ILIKE ${search} OR ${customers.phone} ILIKE ${search} OR ${customers.email} ILIKE ${search} OR ${customers.tinNumber} ILIKE ${search})`
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(where as any);

    const data = await this.db
      .select()
      .from(customers)
      .where(where as any)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findById(id: string) {
    const [customer] = await this.db.select().from(customers).where(eq(customers.id, id));
    if (!customer) return null;

    const stats = await this.getStats(id);
    const orders = await this.getCustomerProjects(id);
    return { ...customer, stats, orders };
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
        type: customers.type,
        address: customers.address,
        tinNumber: customers.tinNumber,
        notes: customers.notes,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .orderBy(desc(customers.createdAt));
  }

  async getCustomerProjects(customerId: string) {
    return this.db
      .select({
        id: projects.id,
        projectNumber: projects.projectNumber,
        title: projects.title,
        division: projects.division,
        status: projects.status,
        priority: projects.priority,
        orderDate: projects.orderDate,
        deliveryDate: projects.deliveryDate,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.customerId, customerId))
      .orderBy(desc(projects.createdAt));
  }

  async getStats(customerId: string) {
    const [orderStats] = await this.db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        completedOrders: sql<number>`count(*) filter (where ${projects.status} = 'completed')::int`,
        deliveredOrders: sql<number>`count(*) filter (where ${projects.status} = 'delivered')::int`,
        inProgressOrders: sql<number>`count(*) filter (where ${projects.status} = 'in_progress')::int`,
        newOrders: sql<number>`count(*) filter (where ${projects.status} = 'new')::int`,
      })
      .from(projects)
      .where(eq(projects.customerId, customerId));

    const [totalAmountResult] = await this.db
      .select({
        totalAmount: sql<string>`coalesce(sum(${invoices.totalAmount}), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.customerId, customerId));

    const [totalPaidResult] = await this.db
      .select({
        totalPaid: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(eq(invoices.customerId, customerId));

    const totalAmount = parseFloat(totalAmountResult?.totalAmount || '0');
    const totalPaid = parseFloat(totalPaidResult?.totalPaid || '0');

    return {
      totalOrders: orderStats?.totalOrders || 0,
      completedOrders: orderStats?.completedOrders || 0,
      deliveredOrders: orderStats?.deliveredOrders || 0,
      inProgressOrders: orderStats?.inProgressOrders || 0,
      newOrders: orderStats?.newOrders || 0,
      totalAmount,
      totalPaid,
      pendingAmount: totalAmount - totalPaid,
    };
  }
}
