import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanySettingsRepository } from './company-settings.repository';

@Injectable()
export class CompanySettingsService {
  constructor(private readonly repo: CompanySettingsRepository) {}

  async findAll() {
    return this.repo.findAll();
  }

  async findByKey(key: string) {
    const setting = await this.repo.findByKey(key);
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return setting;
  }

  async getValue(key: string): Promise<string | null> {
    return this.repo.getValue(key);
  }

  async getCompanyInfo() {
    return this.repo.getMany([
      'company_name',
      'company_phone',
      'company_email',
      'company_address',
      'company_tin',
      'vat_rate',
      'bank_name',
      'bank_account_number',
      'bank_account_name',
    ]);
  }

  async upsert(key: string, value: string) {
    return this.repo.upsert(key, value);
  }

  async bulkUpdate(settings: Record<string, string>) {
    return this.repo.bulkUpsert(settings);
  }

  async delete(key: string) {
    const setting = await this.repo.findByKey(key);
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    await this.repo.delete(key);
  }
}
