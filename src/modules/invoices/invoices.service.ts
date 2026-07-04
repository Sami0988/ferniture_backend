import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import { InvoicesRepository } from './invoices.repository';
import { UploadsService } from '../uploads/uploads.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly repo: InvoicesRepository,
    private readonly uploadsService: UploadsService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly companySettingsService: CompanySettingsService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  async create(data: any, createdBy: string) {
    return this.repo.create({ ...data, createdBy });
  }

  async findById(id: string) {
    const invoice = await this.repo.findById(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async findAll(pagination: PaginationDto, filters?: { paymentStatus?: string }) {
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

    // Generate QR code as data URL
    const invoiceUrl = `${this.configService.get('app.frontendUrl') || 'http://localhost:3000'}/invoices/${invoiceId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(invoiceUrl, { width: 120, margin: 1 });

    // Get company settings from DB
    const companyInfo = await this.companySettingsService.getCompanyInfo();

    const html = this.buildInvoiceHtml(invoice, qrCodeDataUrl, companyInfo);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
      });

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
    } finally {
      await browser.close();
    }
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
      await this.emailQueue.add('send-invoice', {
        to: invoice.customerEmail,
        invoiceNumber: invoice.invoiceNumber,
        projectNumber: invoice.projectNumber,
        totalAmount: invoice.totalAmount,
        pdfUrl: invoice.pdfUrl || '',
        customerName: invoice.customerName,
      });
      return { success: true, message: `Invoice emailed to ${invoice.customerEmail}` };
    } catch (error) {
      this.logger.error(`Failed to email invoice: ${error.message}`);
      return { success: false, message: 'Failed to send email' };
    }
  }

  private buildInvoiceHtml(invoice: any, qrCodeDataUrl: string, companyInfo: Record<string, string>): string {
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
          .company-details { font-size: 12px; color: #666; margin-top: 5px; }
          .invoice-title { font-size: 20px; margin-top: 10px; color: #666; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .details div { width: 48%; }
          .details h3 { color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #2563eb; color: white; }
          .totals { text-align: right; }
          .totals table { width: 300px; margin-left: auto; }
          .totals td { padding: 5px 10px; }
          .total-row { font-weight: bold; font-size: 16px; border-top: 2px solid #2563eb; }
          .payment-info { margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .payment-info h3 { color: #2563eb; margin-top: 0; }
          .qr-section { text-align: center; margin-top: 30px; }
          .qr-section img { margin: 0 auto; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companySettings.name}</div>
          <div class="company-details">
            ${companySettings.address} | ${companySettings.phone} | ${companySettings.email}
            <br>TIN: ${companySettings.tin}
          </div>
          <div class="invoice-title">INVOICE</div>
        </div>

        <div class="details">
          <div>
            <h3>Bill To</h3>
            <p><strong>${invoice.customerName || ''}</strong></p>
            <p>${invoice.customerPhone || ''}</p>
            <p>${invoice.customerEmail || ''}</p>
          </div>
          <div style="text-align: right;">
            <h3>Invoice Details</h3>
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Project:</strong> ${invoice.projectNumber || ''} - ${invoice.projectTitle || ''}</p>
            <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${invoice.paymentStatus?.toUpperCase() || 'UNPAID'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${Number(item.unitPrice).toLocaleString()} ETB</td>
                <td>${Number(item.total).toLocaleString()} ETB</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr><td>Subtotal:</td><td>${Number(invoice.subtotal).toLocaleString()} ETB</td></tr>
            <tr><td>Discount:</td><td>${Number(invoice.discountAmount).toLocaleString()} ETB</td></tr>
            <tr><td>VAT (${invoice.vatRate}%):</td><td>${Number(invoice.vatAmount).toLocaleString()} ETB</td></tr>
            <tr class="total-row"><td>Total:</td><td>${Number(invoice.totalAmount).toLocaleString()} ETB</td></tr>
          </table>
        </div>

        ${companySettings.bankName ? `
        <div class="payment-info">
          <h3>Payment Information</h3>
          <p><strong>Bank:</strong> ${companySettings.bankName}</p>
          <p><strong>Account:</strong> ${companySettings.bankAccountNumber}</p>
          <p><strong>Name:</strong> ${companySettings.bankAccountName}</p>
        </div>
        ` : ''}

        <div class="qr-section">
          <p>Scan to view invoice online</p>
          <img src="${qrCodeDataUrl}" alt="Invoice QR Code" />
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>${companySettings.name} | ${companySettings.phone}</p>
          <p>${companySettings.email}</p>
        </div>
      </body>
      </html>
    `;
  }
}
