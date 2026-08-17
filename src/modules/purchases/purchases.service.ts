import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PurchasesRepository } from './purchases.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { calculatePurchaseTax } from '../tax/tax-calculation.util';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(private readonly repo: PurchasesRepository) {}

  async findAll(
    pagination: PaginationDto,
    filters?: { supplierId?: string; from?: string; to?: string },
  ): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination, filters);
  }

  async findById(id: string) {
    const purchase = await this.repo.findById(id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async create(data: any, createdBy: string) {
    const items = data.items || [];
    const lineTotals = items.map((item: any) => ({
      ...item,
      lineTotal: Math.round(item.quantity * item.unitPrice * 100) / 100,
    }));

    const amountBeforeVat = lineTotals.reduce(
      (sum: number, item: any) => sum + item.lineTotal,
      0,
    );

    const { vatAmount, withholdingAmount, totalAmount } =
      calculatePurchaseTax(amountBeforeVat);

    const purchaseData = {
      supplierId: data.supplierId,
      fsNumber: data.fsNumber,
      bankTransactionNumber: data.bankTransactionNumber,
      purchaseDate: data.purchaseDate,
      amountBeforeVat: String(amountBeforeVat),
      vatAmount: String(vatAmount),
      withholdingAmount: String(withholdingAmount),
      totalAmount: String(totalAmount),
      createdBy,
    };

    const itemsData = lineTotals.map((item: any) => ({
      materialName: item.materialName,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      lineTotal: String(item.lineTotal),
    }));

    return this.repo.create(purchaseData, itemsData);
  }

  async update(id: string, data: any) {
    await this.findById(id);

    let purchaseData: any = {};
    let itemsData: any[] | undefined;

    if (data.supplierId) purchaseData.supplierId = data.supplierId;
    if (data.fsNumber) purchaseData.fsNumber = data.fsNumber;
    if (data.bankTransactionNumber !== undefined)
      purchaseData.bankTransactionNumber = data.bankTransactionNumber;
    if (data.purchaseDate) purchaseData.purchaseDate = data.purchaseDate;

    if (data.items) {
      const lineTotals = data.items.map((item: any) => ({
        ...item,
        lineTotal: Math.round(item.quantity * item.unitPrice * 100) / 100,
      }));

      const amountBeforeVat = lineTotals.reduce(
        (sum: number, item: any) => sum + item.lineTotal,
        0,
      );

      const { vatAmount, withholdingAmount, totalAmount } =
        calculatePurchaseTax(amountBeforeVat);

      purchaseData.amountBeforeVat = String(amountBeforeVat);
      purchaseData.vatAmount = String(vatAmount);
      purchaseData.withholdingAmount = String(withholdingAmount);
      purchaseData.totalAmount = String(totalAmount);

      itemsData = lineTotals.map((item: any) => ({
        materialName: item.materialName,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        lineTotal: String(item.lineTotal),
      }));
    }

    return this.repo.update(id, purchaseData, itemsData);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }
}
