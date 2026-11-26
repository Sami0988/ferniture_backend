import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { and, gte, lte, sql, eq, desc } from 'drizzle-orm';
import { projects, purchases, suppliers, customers } from '../../database/schema';
import { PurchasesRepository } from '../purchases/purchases.repository';
import { resolveDateRange } from './date-range.util';
import { format } from 'date-fns';
import { convertDate, toEC } from '../../common/utils/date-converter.util';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const DEFAULT_BREAKDOWN_LIMIT = 15;

interface PageWindow {
  limit: number;
  offset: number;
}

/**
 * Resolves pagination for one breakdown list. If neither page nor limit was
 * requested the whole list is returned (used by exports). A page past the end
 * is clamped to the last page so the client never gets an empty page while
 * rows exist.
 */
function resolvePagination(total: number, page?: number, limit?: number) {
  if (page === undefined && limit === undefined) {
    return {
      window: undefined as PageWindow | undefined,
      meta: {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }

  const safeLimit = limit ?? DEFAULT_BREAKDOWN_LIMIT;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(page ?? 1, totalPages);

  return {
    window: { limit: safeLimit, offset: (safePage - 1) * safeLimit },
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrevious: safePage > 1,
    },
  };
}

@Injectable()
export class TaxReportService {
  private readonly logger = new Logger(TaxReportService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private readonly purchasesRepo: PurchasesRepository,
  ) {}

  async getTaxReport(query: {
    period?: string;
    referenceDate?: string;
    from?: string;
    to?: string;
    calendar?: 'gc' | 'ec' | 'ec-fiscal';
    fiscalYear?: number;
    fiscalMonth?: number;
    quarter?: number;
    purchasePage?: number;
    purchaseLimit?: number;
    projectPage?: number;
    projectLimit?: number;
  }) {
    const calendar = query.calendar || 'gc';
    const { from, to, label } = resolveDateRange({
      period: query.period as any,
      referenceDate: query.referenceDate,
      from: query.from,
      to: query.to,
      calendar,
      fiscalYear: query.fiscalYear,
      fiscalMonth: query.fiscalMonth,
      quarter: query.quarter,
    });

    // The range is built in server-local time, so read the calendar date in
    // local time too. toISOString() shifts to UTC and moves the date by a day
    // on any server that is not running on UTC.
    const fromDate = format(from, 'yyyy-MM-dd');
    const toDate = format(to, 'yyyy-MM-dd');

    // Totals always cover the whole period; only the breakdown lists are paged.
    const [purchaseAgg, projectAgg] = await Promise.all([
      this.aggregatePurchases(fromDate, toDate),
      this.aggregateProjects(fromDate, toDate),
    ]);

    const purchasePaging = resolvePagination(
      purchaseAgg.count || 0,
      query.purchasePage,
      query.purchaseLimit,
    );
    const projectPaging = resolvePagination(
      projectAgg.count || 0,
      query.projectPage,
      query.projectLimit,
    );

    const [purchaseBreakdown, projectBreakdown] = await Promise.all([
      this.getPurchaseBreakdown(fromDate, toDate, purchasePaging.window),
      this.getProjectBreakdown(fromDate, toDate, projectPaging.window),
    ]);

    const outputVat = round2(parseFloat(projectAgg.totalVat || '0'));
    const inputVat = round2(parseFloat(purchaseAgg.totalVat || '0'));
    const netVat = round2(outputVat - inputVat);

    return {
      calendar,
      period: {
        type: query.period || 'custom',
        from: convertDate(fromDate, calendar),
        to: convertDate(toDate, calendar),
        fromGC: fromDate,
        toGC: toDate,
        label,
      },
      purchases: {
        totalBeforeVat: round2(parseFloat(purchaseAgg.totalBeforeVat || '0')),
        totalVat: inputVat,
        totalWithholding: round2(
          parseFloat(purchaseAgg.totalWithholding || '0'),
        ),
        count: purchaseAgg.count || 0,
        message: (purchaseAgg.count || 0) === 0
          ? `No purchases for this ${query.period || 'period'}`
          : null,
      },
      workProjects: {
        totalBeforeVat: round2(parseFloat(projectAgg.totalBeforeVat || '0')),
        totalVat: outputVat,
        count: projectAgg.count || 0,
        message: (projectAgg.count || 0) === 0
          ? `No paid work projects for this ${query.period || 'period'}`
          : null,
      },
      vatSummary: {
        outputVat,
        inputVat,
        netVat,
        status:
          netVat >= 0
            ? 'PAYABLE_TO_GOVERNMENT'
            : 'REFUNDABLE_FROM_GOVERNMENT',
      },
      withholdingSummary: {
        totalWithheld: round2(
          parseFloat(purchaseAgg.totalWithholding || '0'),
        ),
      },
      breakdown: {
        purchases: purchaseBreakdown.map((p: any) => ({
          ...p,
          purchaseDate: convertDate(p.purchaseDate, calendar),
          purchaseDateGC: p.purchaseDate,
        })),
        workProjects: projectBreakdown.map((p: any) => ({
          ...p,
          paidAt: convertDate(p.paidAt, calendar),
          paidAtGC: p.paidAt,
        })),
        pagination: {
          purchases: purchasePaging.meta,
          workProjects: projectPaging.meta,
        },
      },
    };
  }

  private async aggregatePurchases(fromDate: string, toDate: string) {
    const [result] = await this.db
      .select({
        totalBeforeVat: sql<string>`coalesce(sum(${purchases.amountBeforeVat}::numeric), 0)`,
        totalVat: sql<string>`coalesce(sum(${purchases.vatAmount}::numeric), 0)`,
        totalWithholding: sql<string>`coalesce(sum(${purchases.withholdingAmount}::numeric), 0)`,
        count: sql<number>`count(*)::int`,
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

  private async aggregateProjects(fromDate: string, toDate: string) {
    const [result] = await this.db
      .select({
        totalBeforeVat: sql<string>`coalesce(sum(${projects.priceBeforeVat}::numeric), 0)`,
        totalVat: sql<string>`coalesce(sum(${projects.vatAmount}::numeric), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(
        and(
          sql`${projects.paidAt}::date >= ${fromDate}`,
          sql`${projects.paidAt}::date <= ${toDate}`,
          eq(projects.status, 'paid'),
          gte(projects.paidNowPrice, projects.totalPrice),
        ),
      );

    return result;
  }

  private async getPurchaseBreakdown(
    fromDate: string,
    toDate: string,
    window?: PageWindow,
  ) {
    const query = this.db
      .select({
        id: purchases.id,
        supplierName: suppliers.companyName,
        fsNumber: purchases.fsNumber,
        purchaseDate: purchases.purchaseDate,
        amountBeforeVat: purchases.amountBeforeVat,
        vatAmount: purchases.vatAmount,
        withholdingAmount: purchases.withholdingAmount,
        totalAmount: purchases.totalAmount,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(
        and(
          gte(purchases.purchaseDate, fromDate),
          lte(purchases.purchaseDate, toDate),
        ),
      )
      // Stable order so pages never overlap or skip rows.
      .orderBy(desc(purchases.purchaseDate), desc(purchases.id));

    const rows = await (window
      ? query.limit(window.limit).offset(window.offset)
      : query);

    return rows;
  }

  private async getProjectBreakdown(
    fromDate: string,
    toDate: string,
    window?: PageWindow,
  ) {
    const query = this.db
      .select({
        id: projects.id,
        projectName: projects.title,
        clientName: customers.fullName,
        paidAt: projects.paidAt,
        priceBeforeVat: projects.priceBeforeVat,
        vatAmount: projects.vatAmount,
        totalPrice: projects.totalPrice,
      })
      .from(projects)
      .leftJoin(customers, eq(projects.customerId, customers.id))
      .where(
        and(
          sql`${projects.paidAt}::date >= ${fromDate}`,
          sql`${projects.paidAt}::date <= ${toDate}`,
          eq(projects.status, 'paid'),
          gte(projects.paidNowPrice, projects.totalPrice),
        ),
      )
      .orderBy(desc(projects.paidAt), desc(projects.id));

    const rows = await (window
      ? query.limit(window.limit).offset(window.offset)
      : query);

    return rows;
  }
}
