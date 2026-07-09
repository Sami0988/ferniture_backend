import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { PaymentLettersRepository } from './payment-letters.repository';
import { UploadsService } from '../uploads/uploads.service';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { LetterTemplatesRepository } from '../letter-templates/letter-templates.repository';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentLettersService {
  private readonly logger = new Logger(PaymentLettersService.name);

  constructor(
    private readonly repo: PaymentLettersRepository,
    private readonly uploadsService: UploadsService,
    private readonly companySettingsService: CompanySettingsService,
    private readonly templateRepo: LetterTemplatesRepository,
  ) {}

  async create(data: any, createdBy: string) {
    const templateId = data.templateId ?? (await this.templateRepo.findDefault())?.id;
    if (!templateId) {
      throw new BadRequestException('No template specified and no default template configured');
    }
    return this.repo.create({ ...data, templateId, createdBy });
  }

  async findById(id: string) {
    const letter = await this.repo.findById(id);
    if (!letter) throw new NotFoundException('Payment letter not found');
    return letter;
  }

  async findAll(pagination: PaginationDto, filters?: { projectId?: string; customerId?: string; status?: string }) {
    return this.repo.findAll(pagination, filters);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.repo.update(id, data);
  }

  async markAsSent(id: string) {
    return this.repo.markAsSent(id);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async generatePdfBuffer(id: string): Promise<Buffer> {
    const letter = await this.findById(id);
    const companyInfo = await this.companySettingsService.getCompanyInfo();

    let html: string;

    if (letter.templateId) {
      const template = await this.templateRepo.findById(letter.templateId);
      if (template) {
        const data = this.buildTemplateData(letter, companyInfo);
        html = this.renderTemplate(template.htmlContent, template.cssContent, data);
      } else {
        html = this.buildLetterHtml(letter, companyInfo);
      }
    } else {
      html = this.buildLetterHtml(letter, companyInfo);
    }

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

      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
      });

      const file: Express.Multer.File = {
        buffer: pdfBuffer,
        mimetype: 'application/pdf',
        originalname: `${letter.letterNumber}.pdf`,
        fieldname: 'file',
        encoding: '7bit',
        size: pdfBuffer.length,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      } as any;

      const { url } = await this.uploadsService.uploadDocument(file, 'kassahun/payment-letters');
      await this.repo.updatePdfUrl(id, url);

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildTemplateData(letter: any, companyInfo: Record<string, string>): Record<string, string> {
    const companyLogo = companyInfo.company_logo || '';
    const logoHtml = companyLogo
      ? `<img src="${companyLogo}" alt="Logo" style="height: 50px; margin-right: 15px;" />`
      : '';

    const bodyHtml = letter.body
      .split('\n\n')
      .map((p: string) => `<p style="text-align: justify; margin-bottom: 12px;">${p}</p>`)
      .join('');

    const recipientHtml = [
      `<strong>${letter.recipientCompanyName}</strong>`,
      letter.recipientTitle || '',
      ...(letter.recipientAddress ? letter.recipientAddress.split('\n') : []),
    ].filter(Boolean).join('<br>');

    const formattedDueDate = letter.dueDate
      ? new Date(letter.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

    return {
      companyName: companyInfo.company_name || 'Kassahun Wood and Aluminum Work',
      companyLogo: logoHtml,
      companyPhone: companyInfo.company_phone || '',
      companyEmail: companyInfo.company_email || '',
      signatoryName: companyInfo.signatory_name || companyInfo.company_name || '',
      date: new Date(letter.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      letterNumber: letter.letterNumber,
      recipientCompanyName: letter.recipientCompanyName,
      recipientName: letter.recipientName || '',
      recipientTitle: letter.recipientTitle || '',
      recipientAddress: recipientHtml,
      subject: letter.subject,
      body: bodyHtml,
      referenceNumber: letter.referenceNumber || '',
      dueDate: formattedDueDate,
      closingText: 'Thank you for your cooperation.',
    };
  }

  private renderTemplate(htmlContent: string, cssContent: string | null, data: Record<string, string>): string {
    let html = htmlContent;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, value || '');
    }
    const styleTag = cssContent ? `<style>${cssContent}</style>` : '';
    return `<!DOCTYPE html><html><head>${styleTag}</head><body>${html}</body></html>`;
  }

  private buildLetterHtml(letter: any, companyInfo: Record<string, string>): string {
    const companyName = companyInfo.company_name || 'Kassahun Wood and Aluminum Work';
    const companyPhone = companyInfo.company_phone || '';
    const companyEmail = companyInfo.company_email || '';
    const companyAddress = companyInfo.company_address || '';
    const companyLogo = companyInfo.company_logo || '';
    const signatoryName = companyInfo.signatory_name || companyName;
    const bankName = companyInfo.bank_name || '';
    const bankAccountNumber = companyInfo.bank_account_number || '';
    const bankAccountName = companyInfo.bank_account_name || '';

    const formattedDate = new Date(letter.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const formattedDueDate = letter.dueDate
      ? new Date(letter.dueDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null;

    const recipientLines: string[] = [];
    recipientLines.push(`<strong>${letter.recipientCompanyName}</strong>`);
    if (letter.recipientTitle) recipientLines.push(letter.recipientTitle);
    if (letter.recipientAddress) {
      letter.recipientAddress.split('\n').forEach((line: string) => {
        recipientLines.push(line);
      });
    }

    const bodyParagraphs = letter.body
      .split('\n\n')
      .map((p: string) => `<p style="text-align: justify; margin-bottom: 12px;">${p}</p>`)
      .join('');

    // Watermark based on status
    const watermarkMap: Record<string, string> = {
      draft: 'DRAFT',
      sent: 'SENT',
      paid: 'PAID',
    };
    const watermark = watermarkMap[letter.status] || '';

    // Project amounts
    const totalPrice = Number(letter.projectTotalPrice || 0);
    const totalPaid = Number(letter.projectTotalPaid || 0);
    const balanceDue = Number(letter.projectBalanceDue || 0);

    // Reference line
    const referenceLine = letter.referenceNumber
      ? `<div style="margin-bottom: 5px;"><strong>Ref:</strong> ${letter.referenceNumber}</div>`
      : '';

    // Due date line
    const dueDateLine = formattedDueDate
      ? `<div style="margin-bottom: 5px;"><strong>Payment Due:</strong> ${formattedDueDate}</div>`
      : '';

    // Bank details section
    const bankDetailsHtml = bankName
      ? `
        <div style="margin-top: 30px; padding: 12px 15px; background: #f8f9fa; border-radius: 6px; font-size: 12px;">
          <strong>Bank Details:</strong><br>
          Bank: ${bankName} &nbsp;&nbsp;|&nbsp;&nbsp; Account: ${bankAccountNumber} &nbsp;&nbsp;|&nbsp;&nbsp; Name: ${bankAccountName}
        </div>
      `
      : '';

    // Project details section
    const projectDetailsHtml = `
      <div style="margin: 20px 0; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 13px;">
        <strong>Project:</strong> ${letter.projectNumber || ''} — ${letter.projectTitle || ''}<br>
        <strong>Total Amount:</strong> ${totalPrice.toLocaleString()} ETB &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Paid:</strong> ${totalPaid.toLocaleString()} ETB &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Balance Due:</strong> ${balanceDue.toLocaleString()} ETB
      </div>
    `;

    // Logo HTML
    const logoHtml = companyLogo
      ? `<img src="${companyLogo}" alt="Logo" style="height: 50px; margin-right: 15px;" />`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
          .header-bar { background-color: #4a2c0a; color: white; padding: 15px 30px; display: flex; align-items: center; justify-content: space-between; }
          .header-bar .company-name { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
          .header-left { display: flex; align-items: center; }
          .content { padding: 30px 40px; position: relative; }
          .date-line { text-align: right; margin-bottom: 20px; font-size: 14px; }
          .reference-block { margin-bottom: 20px; font-size: 13px; color: #555; }
          .recipient-block { margin-bottom: 30px; line-height: 1.6; }
          .subject-line { text-align: center; margin: 30px 0; font-size: 14px; }
          .subject-line u { font-weight: bold; }
          .body-content { line-height: 1.8; font-size: 14px; margin-bottom: 30px; }
          .body-content p { margin-bottom: 12px; }
          .closing { text-align: right; margin-top: 50px; line-height: 1.8; }
          .footer { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 30px; font-size: 11px; color: #666; display: flex; justify-content: space-between; }
          .watermark { position: fixed; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; font-weight: bold; color: rgba(0,0,0,0.05); letter-spacing: 10px; pointer-events: none; z-index: 0; }
        </style>
      </head>
      <body>
        ${watermark ? `<div class="watermark">${watermark}</div>` : ''}

        <div class="header-bar">
          <div class="header-left">
            ${logoHtml}
            <div class="company-name">${companyName}</div>
          </div>
        </div>

        <div class="content">
          <div class="date-line">Date: ${formattedDate}</div>

          <div class="reference-block">
            ${referenceLine}
            ${dueDateLine}
          </div>

          ${projectDetailsHtml}

          <div class="recipient-block">
            <div>To</div>
            ${recipientLines.join('<br>')}
          </div>

          <div class="subject-line">
            Subject: <u>${letter.subject}</u>
          </div>

          <div class="body-content">
            ${bodyParagraphs}
          </div>

          ${bankDetailsHtml}

          <div class="closing">
            Thank you for your cooperation.<br><br>
            Yours sincerely,<br>
            <strong>${signatoryName}</strong>
          </div>

          <div class="footer">
            <span>Phone: ${companyPhone}</span>
            <span>Email: ${companyEmail}</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
