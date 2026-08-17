import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { InvoicesRepository } from './invoices.repository';
import { UploadsService } from '../uploads/uploads.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { MailService } from '../../mail/mail.service';
import { generatePdfBuffer } from '../../common/services/pdf.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly repo: InvoicesRepository,
    private readonly uploadsService: UploadsService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly companySettingsService: CompanySettingsService,
    private readonly mailService: MailService,
  ) {}

  async create(data: any, createdBy: string) {
    return this.repo.create({ ...data, createdBy });
  }

  async createFromProject(projectId: string, createdBy: string) {
    return this.repo.createFromProject(projectId, createdBy);
  }

  async findById(id: string) {
    const invoice = await this.repo.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async findByProjectId(projectId: string) {
    return this.repo.findByProjectId(projectId);
  }

  async findAll(pagination: PaginationDto, filters?: { paymentStatus?: string; search?: string }) {
    return this.repo.findAll(pagination, filters);
  }

  async addPayment(invoiceId: string, data: any, verifiedBy: string) {
    await this.findById(invoiceId);
    const payment = await this.repo.addPayment(invoiceId, { ...data, verifiedBy });

    // Notify customer about payment verification
    try {
      const invoice = await this.findById(invoiceId);
      if (invoice.customerName) {
        // Find customer user by email or use a default notification
        await this.notificationsService.notifyPaymentVerified(
          verifiedBy,
          invoice.invoiceNumber,
          `${data.amount} ETB`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send payment notification: ${error.message}`);
    }

    return payment;
  }

  async getPayments(invoiceId: string) {
    await this.findById(invoiceId);
    return this.repo.getPayments(invoiceId);
  }

  async generatePdf(invoiceId: string): Promise<string> {
    const invoice = await this.findById(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');

    const invoiceUrl = `${this.configService.get('app.frontendUrl') || 'http://localhost:3000'}/invoices/${invoiceId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(invoiceUrl, { width: 120, margin: 1 });

    const companyInfo = await this.companySettingsService.getCompanyInfo();
    const docDefinition = this.buildInvoiceDocDefinition(invoice, qrCodeDataUrl, companyInfo);

    const pdfBuffer = await generatePdfBuffer(docDefinition);

    const file: Express.Multer.File = {
      buffer: pdfBuffer,
      mimetype: 'application/pdf',
      originalname: `${invoice.invoiceNumber}.pdf`,
      fieldname: 'file',
      encoding: '7bit',
      size: pdfBuffer.length,
      stream: null,
      destination: '',
      filename: '',
      path: '',
    } as any;

    const { url } = await this.uploadsService.uploadDocument(file, 'kassahun/invoices');
    await this.repo.updatePdfUrl(invoiceId, url);

    return url;
  }

  async generatePdfBuffer(invoiceId: string): Promise<Buffer> {
    const invoice = await this.findById(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');

    const invoiceUrl = `${this.configService.get('app.frontendUrl') || 'http://localhost:3000'}/invoices/${invoiceId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(invoiceUrl, { width: 120, margin: 1 });

    const companyInfo = await this.companySettingsService.getCompanyInfo();
    const docDefinition = this.buildInvoiceDocDefinition(invoice, qrCodeDataUrl, companyInfo);

    const pdfBuffer = await generatePdfBuffer(docDefinition);

    const file: Express.Multer.File = {
      buffer: pdfBuffer,
      mimetype: 'application/pdf',
      originalname: `${invoice.invoiceNumber}.pdf`,
      fieldname: 'file',
      encoding: '7bit',
      size: pdfBuffer.length,
      stream: null,
      destination: '',
      filename: '',
      path: '',
    } as any;

    const { url } = await this.uploadsService.uploadDocument(file, 'kassahun/invoices');
    await this.repo.updatePdfUrl(invoiceId, url);

    return pdfBuffer;
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.repo.update(id, data);
  }

  async updateItems(id: string, items: { description: string; quantity: number; unitPrice: number }[]) {
    await this.findById(id);
    return this.repo.updateItems(id, items);
  }

  async emailInvoice(invoiceId: string): Promise<{ success: boolean; message: string }> {
    const invoice = await this.findById(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (!invoice.customerEmail) {
      return { success: false, message: 'Customer has no email address' };
    }

    try {
      await this.mailService.sendInvoice(invoice.customerEmail, {
        invoiceNumber: invoice.invoiceNumber,
        projectNumber: invoice.projectNumber,
        totalAmount: invoice.totalAmount,
        pdfUrl: `${this.configService.get('app.frontendUrl') || 'https://kassahun-backend.onrender.com'}/api/v1/invoices/${invoiceId}/pdf`,
        customerName: invoice.customerName,
      });
      return { success: true, message: `Invoice emailed to ${invoice.customerEmail}` };
    } catch (error) {
      this.logger.error(`Failed to email invoice: ${error.message}`);
      return { success: false, message: 'Failed to send email' };
    }
  }

  private buildInvoiceDocDefinition(invoice: any, qrCodeDataUrl: string, companyInfo: Record<string, string>) {
    const items = invoice.items || [];
    const companySettings = {
      name: companyInfo.company_name || 'Kassahun Wood and Aluminum Work',
      address: companyInfo.company_address || 'Addis Ababa, Ethiopia',
      phone: companyInfo.company_phone || '+251911000000',
      email: companyInfo.company_email || '',
      tin: companyInfo.company_tin || '0012345678',
      bankName: companyInfo.bank_name || '',
      bankAccountNumber: companyInfo.bank_account_number || '',
      bankAccountName: companyInfo.bank_account_name || '',
    };

    const itemRows = items.map((item: any) => [
      item.description,
      String(item.quantity),
      `${Number(item.unitPrice).toLocaleString()} ETB`,
      `${Number(item.total).toLocaleString()} ETB`,
    ]);

    const content: any[] = [
      { text: companySettings.name, style: 'companyName' },
      { text: `${companySettings.address} | ${companySettings.phone} | ${companySettings.email}\nTIN: ${companySettings.tin}`, style: 'companyDetails', margin: [0, 5, 0, 5] },
      { text: 'INVOICE', style: 'invoiceTitle', margin: [0, 10, 0, 20] },
      {
        columns: [
          {
            width: '*',
            text: [
              { text: 'Bill To\n', bold: true, fontSize: 12 },
              { text: `${invoice.customerName || ''}\n${invoice.customerPhone || ''}\n${invoice.customerEmail || ''}` },
            ],
          },
          {
            width: '*',
            text: [
              { text: 'Invoice Details\n', bold: true, fontSize: 12 },
              { text: `Invoice #: ${invoice.invoiceNumber}\n` },
              { text: `Project: ${invoice.projectNumber || ''} - ${invoice.projectTitle || ''}\n` },
              { text: `Date: ${new Date(invoice.createdAt).toLocaleDateString()}\n` },
              { text: `Status: ${invoice.paymentStatus?.toUpperCase() || 'UNPAID'}` },
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 20],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            ['Description', 'Qty', 'Unit Price', 'Total'],
            ...itemRows,
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15],
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            table: {
              widths: ['*', '*'],
              body: [
                ['Subtotal:', `${Number(invoice.subtotal).toLocaleString()} ETB`],
                ['Discount:', `${Number(invoice.discountAmount).toLocaleString()} ETB`],
                [`VAT (${invoice.vatRate}%):`, `${Number(invoice.vatAmount).toLocaleString()} ETB`],
                [{ text: 'Total:', bold: true, fontSize: 14 }, { text: `${Number(invoice.totalAmount).toLocaleString()} ETB`, bold: true, fontSize: 14 }],
              ],
            },
            layout: 'noBorders',
          },
        ],
        margin: [0, 0, 0, 20],
      },
    ];

    if (companySettings.bankName) {
      content.push({
        text: [
          { text: 'Payment Information\n', bold: true, fontSize: 12 },
          { text: `Bank: ${companySettings.bankName}\n` },
          { text: `Account: ${companySettings.bankAccountNumber}\n` },
          { text: `Name: ${companySettings.bankAccountName}` },
        ],
        margin: [0, 0, 0, 20],
      });
    }

    content.push(
      { text: 'Scan to view invoice online', alignment: 'center', margin: [0, 10, 0, 5] },
      { image: qrCodeDataUrl, width: 120, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: 'Thank you for your business!', alignment: 'center', margin: [0, 20, 0, 5] },
      { text: `${companySettings.name} | ${companySettings.phone}`, alignment: 'center', fontSize: 9, color: '#999' },
      { text: companySettings.email, alignment: 'center', fontSize: 9, color: '#999', margin: [0, 2, 0, 0] },
    );

    return {
      content,
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      styles: {
        companyName: { fontSize: 22, bold: true, color: '#2563eb', alignment: 'center' },
        companyDetails: { fontSize: 10, color: '#666', alignment: 'center' },
        invoiceTitle: { fontSize: 18, color: '#666', alignment: 'center' },
      },
      pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    };
  }
}
