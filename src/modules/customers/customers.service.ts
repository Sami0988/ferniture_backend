import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination);
  }

  async findById(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(data: any, createdBy?: string) {
    return this.repo.create(data, createdBy);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async search(term: string) {
    return this.repo.search(term);
  }

  async exportAll() {
    const customers = await this.repo.findAllForExport();
    // Convert to CSV
    const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Address', 'TIN Number', 'Notes', 'Created At'];
    const rows = customers.map((c: any) => [
      c.id,
      c.fullName,
      c.phone,
      c.email || '',
      c.address || '',
      c.tinNumber || '',
      c.notes || '',
      new Date(c.createdAt).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    return { csv, filename: `customers-export-${new Date().toISOString().split('T')[0]}.csv`, count: customers.length };
  }
}
