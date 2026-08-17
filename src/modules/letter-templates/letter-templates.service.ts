import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { LetterTemplatesRepository } from './letter-templates.repository';
import { UploadsService } from '../uploads/uploads.service';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { CreateLetterTemplateDto, UpdateLetterTemplateDto } from './dto/letter-template.dto';
import { validateAndSanitizeTemplate } from './utils/template-validator';
import { generatePdfBuffer } from '../../common/services/pdf.service';

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

    const content = this.htmlToPdfmakeContent(html);

    const docDefinition = {
      content,
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    };

    return generatePdfBuffer(docDefinition);
  }

  private htmlToPdfmakeContent(html: string): any[] {
    const content: any[] = [];

    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let lastIndex = 0;
    let match;

    while ((match = tableRegex.exec(html)) !== null) {
      const beforeTable = html.slice(lastIndex, match.index);
      if (beforeTable.trim()) {
        content.push(...this.extractTextContent(beforeTable));
      }

      const tableContent = match[1];
      const rows: any[][] = [];
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
        const cells: any[] = [];
        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
          cells.push({ text: this.stripHtml(cellMatch[1]).trim() });
        }
        if (cells.length > 0) rows.push(cells);
      }

      if (rows.length > 0) {
        content.push({
          table: {
            headerRows: 1,
            widths: rows[0].map(() => '*'),
            body: rows,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 10, 0, 10],
        });
      }

      lastIndex = match.index + match[0].length;
    }

    const remaining = html.slice(lastIndex);
    if (remaining.trim()) {
      content.push(...this.extractTextContent(remaining));
    }

    if (content.length === 0) {
      content.push({ text: this.stripHtml(html).trim() || ' ' });
    }

    return content;
  }

  private extractTextContent(html: string): any[] {
    const content: any[] = [];
    const blocks = html.split(/(?:<br\s*\/?>|<\/p>|<\/div>|<\/h[1-6]>|<\/li>)/i);

    for (const block of blocks) {
      const text = this.stripHtml(block).trim();
      if (!text) continue;

      if (/^<h[1-6]/i.test(block.trim())) {
        const level = parseInt(block.match(/<h(\d)/i)?.[1] || '2');
        content.push({ text, style: level <= 2 ? 'header' : 'subheader', margin: [0, 10, 0, 5] });
      } else if (/^<li/i.test(block.trim())) {
        content.push({ text: `• ${text}`, margin: [15, 2, 0, 2] });
      } else {
        content.push({ text, margin: [0, 0, 0, 8], alignment: 'justify' as const });
      }
    }

    return content;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}
