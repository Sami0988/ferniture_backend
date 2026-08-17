import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { PurchasesRepository } from '../purchases/purchases.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    private readonly repo: SuppliersRepository,
    private readonly purchasesRepo: PurchasesRepository,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: { search?: string },
  ): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination, filters);
  }

  async findById(id: string) {
    const supplier = await this.repo.findById(id);
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(data: any) {
    const existing = await this.repo.findByTinNumber(data.tinNumber);
    if (existing) {
      throw new ConflictException(
        `A supplier with TIN number "${data.tinNumber}" already exists`,
      );
    }
    return this.repo.create(data);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    if (data.tinNumber) {
      const existing = await this.repo.findByTinNumber(data.tinNumber);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `A supplier with TIN number "${data.tinNumber}" already exists`,
        );
      }
    }
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);

    const purchaseCount = await this.purchasesRepo.countBySupplierId(id);
    if (purchaseCount > 0) {
      throw new ConflictException(
        `Cannot delete supplier: ${purchaseCount} purchase(s) reference this supplier. Remove or reassign purchases first.`,
      );
    }

    await this.repo.delete(id);
  }

  async search(term: string) {
    return this.repo.search(term);
  }
}
