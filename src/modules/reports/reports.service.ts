import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';
import { projects, invoices, payments, customers, users, projectAssignees } from '../../database/schema';

@Injectable()
export class ReportsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async getDashboardSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Total counts
    const [totalProjects] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects);

    const [activeProjects] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.status, 'in_progress'));

    const [completedProjects] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.status, 'completed'));

    const [totalCustomers] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers);

    const [totalEmployees] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'employee'));

    // Revenue this month
    const [monthlyRevenue] = await this.db
      .select({ total: sql<number>`COALESCE(sum(amount::numeric), 0)::numeric` })
      .from(payments)
      .where(gte(payments.createdAt, startOfMonth));

    // Revenue this year
    const [yearlyRevenue] = await this.db
      .select({ total: sql<number>`COALESCE(sum(amount::numeric), 0)::numeric` })
      .from(payments)
      .where(gte(payments.createdAt, startOfYear));

    // Outstanding balance
    const [outstanding] = await this.db
      .select({ total: sql<number>`COALESCE(sum(total_amount::numeric - paid_total), 0)::numeric` })
      .from(invoices)
      .where(eq(invoices.paymentStatus, 'partial'));

    // Projects by status
    const projectsByStatus = await this.db
      .select({
        status: projects.status,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .groupBy(projects.status);

    // Projects by division
    const projectsByDivision = await this.db
      .select({
        division: projects.division,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .groupBy(projects.division);

    // Recent projects
    const recentProjects = await this.db
      .select({
        id: projects.id,
        projectNumber: projects.projectNumber,
        title: projects.title,
        status: projects.status,
        division: projects.division,
        createdAt: projects.createdAt,
        customerName: customers.fullName,
      })
      .from(projects)
      .leftJoin(customers, eq(projects.customerId, customers.id))
      .orderBy(desc(projects.createdAt))
      .limit(5);

    // Recent payments
    const recentPayments = await this.db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        paidAt: payments.paidAt,
        invoiceNumber: invoices.invoiceNumber,
        customerName: customers.fullName,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(payments.createdAt))
      .limit(5);

    return {
      totals: {
        projects: totalProjects.count,
        activeProjects: activeProjects.count,
        completedProjects: completedProjects.count,
        customers: totalCustomers.count,
        employees: totalEmployees.count,
      },
      revenue: {
        thisMonth: Number(monthlyRevenue.total),
        thisYear: Number(yearlyRevenue.total),
        outstanding: Number(outstanding.total),
      },
      projectsByStatus,
      projectsByDivision,
      recentProjects,
      recentPayments,
    };
  }

  async getProjectStats(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const projectsByMonth = await this.db
      .select({
        month: sql<string>`to_char(created_at, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(and(gte(projects.createdAt, start), lte(projects.createdAt, end)))
      .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
      .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

    const projectsByDivision = await this.db
      .select({
        division: projects.division,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(and(gte(projects.createdAt, start), lte(projects.createdAt, end)))
      .groupBy(projects.division);

    const projectsByStatus = await this.db
      .select({
        status: projects.status,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(and(gte(projects.createdAt, start), lte(projects.createdAt, end)))
      .groupBy(projects.status);

    return {
      period: { start, end },
      byMonth: projectsByMonth,
      byDivision: projectsByDivision,
      byStatus: projectsByStatus,
    };
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const revenueByMonth = await this.db
      .select({
        month: sql<string>`to_char(paid_at, 'YYYY-MM')`,
        total: sql<number>`COALESCE(sum(amount::numeric), 0)::numeric`,
        count: sql<number>`count(*)::int`,
      })
      .from(payments)
      .where(and(gte(payments.paidAt, start), lte(payments.paidAt, end)))
      .groupBy(sql`to_char(paid_at, 'YYYY-MM')`)
      .orderBy(sql`to_char(paid_at, 'YYYY-MM')`);

    const revenueByMethod = await this.db
      .select({
        method: payments.method,
        total: sql<number>`COALESCE(sum(amount::numeric), 0)::numeric`,
        count: sql<number>`count(*)::int`,
      })
      .from(payments)
      .where(and(gte(payments.paidAt, start), lte(payments.paidAt, end)))
      .groupBy(payments.method);

    const totalRevenue = revenueByMonth.reduce((sum, r) => sum + Number(r.total), 0);
    const totalTransactions = revenueByMonth.reduce((sum, r) => sum + r.count, 0);

    return {
      period: { start, end },
      totalRevenue,
      totalTransactions,
      byMonth: revenueByMonth,
      byMethod: revenueByMethod,
    };
  }

  async getCustomerReport() {
    const topCustomers = await this.db
      .select({
        id: customers.id,
        fullName: customers.fullName,
        phone: customers.phone,
        totalProjects: sql<number>`count(distinct ${projects.id})::int`,
        totalSpent: sql<number>`COALESCE(sum(${payments.amount}::numeric), 0)::numeric`,
      })
      .from(customers)
      .leftJoin(projects, eq(projects.customerId, customers.id))
      .leftJoin(invoices, eq(invoices.customerId, customers.id))
      .leftJoin(payments, eq(payments.invoiceId, invoices.id))
      .groupBy(customers.id)
      .orderBy(desc(sql`COALESCE(sum(${payments.amount}::numeric), 0)::numeric`))
      .limit(10);

    return { topCustomers };
  }

  async getOverdueProjects() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD string format

    const overdueProjects = await this.db
      .select({
        id: projects.id,
        projectNumber: projects.projectNumber,
        title: projects.title,
        status: projects.status,
        deliveryDate: projects.deliveryDate,
        customerName: customers.fullName,
        leadEmployee: users.fullName,
      })
      .from(projects)
      .leftJoin(customers, eq(projects.customerId, customers.id))
      .leftJoin(users, eq(projects.leadEmployeeId, users.id))
      .where(
        and(
          lte(projects.deliveryDate, today),
          eq(projects.status, 'in_progress'),
        ),
      )
      .orderBy(projects.deliveryDate);

    return { overdueProjects, count: overdueProjects.length };
  }

  async getEmployeePerformance() {
    const employees = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        phone: users.phone,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.role, 'employee'));

    const performance = await Promise.all(
      employees.map(async (emp) => {
        // Total projects assigned
        const [totalProjects] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(projectAssignees)
          .where(eq(projectAssignees.employeeId, emp.id));

        // Completed projects
        const [completedProjects] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(projectAssignees)
          .innerJoin(projects, eq(projectAssignees.projectId, projects.id))
          .where(and(
            eq(projectAssignees.employeeId, emp.id),
            eq(projects.status, 'completed'),
          ));

        // Active projects
        const [activeProjects] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(projectAssignees)
          .innerJoin(projects, eq(projectAssignees.projectId, projects.id))
          .where(and(
            eq(projectAssignees.employeeId, emp.id),
            eq(projects.status, 'in_progress'),
          ));

        // Revenue from completed projects
        const [revenue] = await this.db
          .select({ total: sql<number>`COALESCE(sum(${payments.amount}::numeric), 0)::numeric` })
          .from(projectAssignees)
          .innerJoin(projects, eq(projectAssignees.projectId, projects.id))
          .innerJoin(invoices, eq(invoices.projectId, projects.id))
          .leftJoin(payments, eq(payments.invoiceId, invoices.id))
          .where(eq(projectAssignees.employeeId, emp.id));

        return {
          ...emp,
          totalProjects: totalProjects.count,
          completedProjects: completedProjects.count,
          activeProjects: activeProjects.count,
          totalRevenue: Number(revenue.total),
          completionRate: totalProjects.count > 0
            ? Math.round((completedProjects.count / totalProjects.count) * 100)
            : 0,
        };
      }),
    );

    return performance.sort((a, b) => b.completedProjects - a.completedProjects);
  }
}
