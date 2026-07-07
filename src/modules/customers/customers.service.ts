import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly repo: CustomersRepository,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll(pagination: PaginationDto, filters?: { type?: string; search?: string }): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination, filters);
  }

  async findById(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(data: any, createdBy?: string, file?: Express.Multer.File) {
    if (file) {
      const result = await this.uploadsService.uploadImage(file, 'kassahun/customers');
      data.imageUrl = result.url;
    }
    return this.repo.create(data, createdBy);
  }

  async update(id: string, data: any, file?: Express.Multer.File) {
    await this.findById(id);
    if (file) {
      const result = await this.uploadsService.uploadImage(file, 'kassahun/customers');
      data.imageUrl = result.url;
    }
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async search(term: string) {
    return this.repo.search(term);
  }

  async getStats(id: string) {
    await this.findById(id);
    return this.repo.getStats(id);
  }

  async exportAll() {
    const customers = await this.repo.findAllForExport();
    // Convert to CSV
    const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Type', 'Address', 'TIN Number', 'Notes', 'Created At'];
    const rows = customers.map((c: any) => [
      c.id,
      c.fullName,
      c.phone,
      c.email || '',
      c.type || 'personal',
      c.address || '',
      c.tinNumber || '',
      c.notes || '',
      new Date(c.createdAt).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    return { csv, filename: `customers-export-${new Date().toISOString().split('T')[0]}.csv`, count: customers.length };
  }
}
