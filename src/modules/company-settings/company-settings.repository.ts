import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq } from 'drizzle-orm';
import { companySettings } from '../../database/schema';

@Injectable()
export class CompanySettingsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll() {
    return this.db.select().from(companySettings);
  }

  async findByKey(key: string) {
    const [setting] = await this.db
      .select()
      .from(companySettings)
      .where(eq(companySettings.key, key));

    return setting || null;
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.findByKey(key);
    return setting?.value || null;
  }

  async getMany(keys: string[]) {
    const settings = await this.db
      .select()
      .from(companySettings);

    const result: Record<string, string> = {};
    for (const s of settings) {
      if (keys.length === 0 || keys.includes(s.key)) {
        result[s.key] = s.value;
      }
    }
    return result;
  }

  async upsert(key: string, value: string) {
    const existing = await this.findByKey(key);

    if (existing) {
      await this.db
        .update(companySettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(companySettings.key, key));
    } else {
      await this.db.insert(companySettings).values({ key, value });
    }

    return this.findByKey(key);
  }

  async bulkUpsert(settings: Record<string, string>) {
    for (const [key, value] of Object.entries(settings)) {
      await this.upsert(key, value);
    }
    return this.findAll();
  }

  async delete(key: string) {
    await this.db.delete(companySettings).where(eq(companySettings.key, key));
  }
}
