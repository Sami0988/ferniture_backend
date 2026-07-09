import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { LetterTemplatesRepository } from './letter-templates.repository';
import { UploadsService } from '../uploads/uploads.service';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { CreateLetterTemplateDto, UpdateLetterTemplateDto } from './dto/letter-template.dto';
import { validateAndSanitizeTemplate } from './utils/template-validator';

@Injectable()
export class LetterTemplatesService {
  private readonly logger = new Logger(LetterTemplatesService.name);

  constructor(
    private readonly repository: LetterTemplatesRepository,
    private readonly uploadsService: UploadsService,
    private readonly companySettingsService: CompanySettingsService,
  ) {}

  async create(dto: CreateLetterTemplateDto, userId: string) {
    const sanitized = validateAndSanitizeTemplate(dto.htmlContent);
    return this.repository.create({ ...dto, htmlContent: sanitized, createdBy: userId });
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    const template = await this.repository.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async findDefault() {
    return this.repository.findDefault();
  }

  async update(id: string, dto: UpdateLetterTemplateDto) {
    await this.findOne(id);
    if (dto.htmlContent) {
      dto.htmlContent = validateAndSanitizeTemplate(dto.htmlContent);
    }
    const updated = await this.repository.update(id, dto);
    if (!updated) throw new NotFoundException('Template not found');
    return updated;
  }

  async setDefault(id: string) {
    await this.findOne(id);
    await this.repository.clearDefault();
    return this.repository.update(id, { isDefault: true });
  }

  async remove(id: string) {
    const template = await this.findOne(id);
    if (template.isDefault) {
      throw new ConflictException('Cannot delete the default template — set another as default first');
    }
    const usageCount = await this.repository.countLettersUsingTemplate(id);
    if (usageCount > 0) {
      throw new ConflictException(`Cannot delete — ${usageCount} letter(s) still reference this template`);
    }
    await this.repository.remove(id);
  }

  async preview(id: string): Promise<Buffer> {
    const template = await this.findOne(id);
    const sampleData = {
      companyName: 'Sample Company PLC',
      companyLogo: '',
      companyPhone: '+251900000000',
      companyEmail: 'sample@company.com',
      signatoryName: 'Sample Signatory',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      letterNumber: 'PL-2026-0000',
      recipientCompanyName: 'Sample Bank Head Office',
      recipientName: 'Sample Contact',
      recipientTitle: 'Procurement Division',
      recipientAddress: 'Addis Ababa, Ethiopia',
      subject: 'Sample Subject Line for Preview',
      body: 'This is sample paragraph one for preview purposes.\n\nThis is sample paragraph two.',
      referenceNumber: 'REF-2026-0001',
      dueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      closingText: 'Thank you for your cooperation.',
    };
    return this.renderToPdf(template.htmlContent, template.cssContent, sampleData);
  }

  async renderToPdf(htmlContent: string, cssContent: string | null, data: Record<string, string>): Promise<Buffer> {
    let html = htmlContent;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, value || '');
    }

    const styleTag = cssContent ? `<style>${cssContent}</style>` : '';
    const fullHtml = `<!DOCTYPE html><html><head>${styleTag}</head><body>${html}</body></html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() === 'document' || req.resourceType() === 'xhr') {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
