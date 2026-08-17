import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { and, gte, lte, sql, eq } from 'drizzle-orm';
import { projects, purchases, suppliers, customers } from '../../database/schema';
import { PurchasesRepository } from '../purchases/purchases.repository';
import { resolveDateRange } from './date-range.util';
import { generatePdfBuffer } from '../../common/services/pdf.service';

function round2(n: number) {
  return Math.round(n * 100) / 100;
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
  }) {
    const { from, to, label } = resolveDateRange({
      period: query.period as any,
      referenceDate: query.referenceDate,
      from: query.from,
      to: query.to,
    });

    const fromDate = from.toISOString().split('T')[0];
    const toDate = to.toISOString().split('T')[0];

    const [purchaseAgg, projectAgg, purchaseBreakdown, projectBreakdown] =
      await Promise.all([
        this.aggregatePurchases(fromDate, toDate),
        this.aggregateProjects(fromDate, toDate),
        this.getPurchaseBreakdown(fromDate, toDate),
        this.getProjectBreakdown(fromDate, toDate),
      ]);

    const outputVat = round2(parseFloat(projectAgg.totalVat || '0'));
    const inputVat = round2(parseFloat(purchaseAgg.totalVat || '0'));
    const netVat = round2(outputVat - inputVat);

    return {
      period: {
        type: query.period || 'custom',
        from: fromDate,
        to: toDate,
        label,
      },
      purchases: {
        totalBeforeVat: round2(parseFloat(purchaseAgg.totalBeforeVat || '0')),
        totalVat: inputVat,
        totalWithholding: round2(
          parseFloat(purchaseAgg.totalWithholding || '0'),
        ),
        count: purchaseAgg.count || 0,
      },
      workProjects: {
        totalBeforeVat: round2(parseFloat(projectAgg.totalBeforeVat || '0')),
        totalVat: outputVat,
        count: projectAgg.count || 0,
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
        purchases: purchaseBreakdown,
        workProjects: projectBreakdown,
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
          gte(projects.orderDate, fromDate),
          lte(projects.orderDate, toDate),
        ),
      );

    return result;
  }

  private async getPurchaseBreakdown(fromDate: string, toDate: string) {
    const rows = await this.db
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
      );

    return rows;
  }

  private async getProjectBreakdown(fromDate: string, toDate: string) {
    const rows = await this.db
      .select({
        id: projects.id,
        projectName: projects.title,
        clientName: customers.fullName,
        projectDate: projects.orderDate,
        priceBeforeVat: projects.priceBeforeVat,
        vatAmount: projects.vatAmount,
        totalPrice: projects.totalPrice,
      })
      .from(projects)
      .leftJoin(customers, eq(projects.customerId, customers.id))
      .where(
        and(
          gte(projects.orderDate, fromDate),
          lte(projects.orderDate, toDate),
        ),
      );

    return rows;
  }
}
