import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql } from 'drizzle-orm';
import { letterTemplates, paymentLetters } from '../../database/schema';

@Injectable()
export class LetterTemplatesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async create(data: {
    name: string;
    description?: string;
    htmlContent: string;
    cssContent?: string;
    recipientCompanyName?: string;
    recipientTitle?: string;
    recipientAddress?: string;
    subject?: string;
    body?: string;
    referenceNumber?: string;
    dueDate?: string;
    isDefault?: boolean;
    createdBy: string;
  }) {
    const [template] = await this.db
      .insert(letterTemplates)
      .values({
        name: data.name,
        description: data.description || null,
        htmlContent: data.htmlContent,
        cssContent: data.cssContent || null,
        recipientCompanyName: data.recipientCompanyName || null,
        recipientTitle: data.recipientTitle || null,
        recipientAddress: data.recipientAddress || null,
        subject: data.subject || null,
        body: data.body || null,
        referenceNumber: data.referenceNumber || null,
        dueDate: data.dueDate || null,
        isDefault: data.isDefault || false,
        createdBy: data.createdBy,
      })
      .returning();

    return template;
  }

  async findById(id: string) {
    const [template] = await this.db
      .select()
      .from(letterTemplates)
      .where(eq(letterTemplates.id, id));

    return template || null;
  }

  async findAll() {
    return this.db
      .select({
        id: letterTemplates.id,
        name: letterTemplates.name,
        description: letterTemplates.description,
        recipientCompanyName: letterTemplates.recipientCompanyName,
        recipientTitle: letterTemplates.recipientTitle,
        recipientAddress: letterTemplates.recipientAddress,
        subject: letterTemplates.subject,
        body: letterTemplates.body,
        referenceNumber: letterTemplates.referenceNumber,
        dueDate: letterTemplates.dueDate,
        isDefault: letterTemplates.isDefault,
        isActive: letterTemplates.isActive,
        createdBy: letterTemplates.createdBy,
        createdAt: letterTemplates.createdAt,
        updatedAt: letterTemplates.updatedAt,
      })
      .from(letterTemplates)
      .orderBy(desc(letterTemplates.createdAt));
  }

  async findDefault() {
    const [row] = await this.db
      .select()
      .from(letterTemplates)
      .where(eq(letterTemplates.isDefault, true));

    return row || undefined;
  }

  async clearDefault() {
    await this.db
      .update(letterTemplates)
      .set({ isDefault: false })
      .where(eq(letterTemplates.isDefault, true));
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    htmlContent?: string;
    cssContent?: string;
    recipientCompanyName?: string;
    recipientTitle?: string;
    recipientAddress?: string;
    subject?: string;
    body?: string;
    referenceNumber?: string;
    dueDate?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }) {
    const [updated] = await this.db
      .update(letterTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(letterTemplates.id, id))
      .returning();

    return updated || null;
  }

  async remove(id: string) {
    await this.db.delete(letterTemplates).where(eq(letterTemplates.id, id));
  }

  async countLettersUsingTemplate(templateId: string): Promise<number> {
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(paymentLetters)
      .where(eq(paymentLetters.templateId, templateId));
    return Number(count);
  }
}
