import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProformasRepository } from './proformas.repository';
import { UploadsService } from '../uploads/uploads.service';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { generatePdfBuffer } from '../../common/services/pdf.service';

@Injectable()
export class ProformasService {
  private readonly logger = new Logger(ProformasService.name);

  constructor(
    private readonly repo: ProformasRepository,
    private readonly uploadsService: UploadsService,
    private readonly companySettingsService: CompanySettingsService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: any, createdBy: string) {
    return this.repo.create({ ...data, createdBy });
  }

  async findById(id: string) {
    const proforma = await this.repo.findById(id);
    if (!proforma) throw new NotFoundException('Proforma not found');
    return proforma;
  }

  async findAll(pagination: PaginationDto, filters?: { projectId?: string; customerId?: string; status?: string }) {
    return this.repo.findAll(pagination, filters);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.repo.update(id, data);
  }

  async markAsSent(id: string) {
    return this.repo.updateStatus(id, 'sent');
  }

  async markAsAccepted(id: string) {
    return this.repo.updateStatus(id, 'accepted');
  }

  async cancel(id: string) {
    return this.repo.updateStatus(id, 'cancelled');
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async generatePdfBuffer(id: string): Promise<Buffer> {
    const proforma = await this.findById(id);
    const companyInfo = await this.companySettingsService.getCompanyInfo();

    const docDefinition = this.buildProformaDocDefinition(proforma, companyInfo);
    const pdfBuffer = await generatePdfBuffer(docDefinition);

    try {
      const file: Express.Multer.File = {
        buffer: pdfBuffer,
        mimetype: 'application/pdf',
        originalname: `${proforma.proformaNumber}.pdf`,
        fieldname: 'file',
        encoding: '7bit',
        size: pdfBuffer.length,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      } as any;

      const { url } = await this.uploadsService.uploadDocument(file, 'kassahun/proformas');
      await this.repo.updatePdfUrl(id, url);
    } catch (err) {
      this.logger.warn(`Cloudinary upload failed, returning buffer directly: ${err.message}`);
    }

    return pdfBuffer;
  }

  private buildProformaDocDefinition(proforma: any, companyInfo: Record<string, string>) {
    const companySettings = {
      name: companyInfo.company_name || 'Kassahun Wood and Aluminum Work',
      address: companyInfo.company_address || 'Addis Ababa, Ethiopia',
      phone: companyInfo.company_phone || '+251911000000',
      email: companyInfo.company_email || '',
      tin: companyInfo.company_tin || '0012345678',
      bankName: companyInfo.bank_name || '',
      bankAccountNumber: companyInfo.bank_account_number || '',
      bankAccountName: companyInfo.bank_account_name || '',
      logo: companyInfo.company_logo || '',
    };

    const items = proforma.items || [];
    const formattedDate = new Date(proforma.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    const expiryDate = new Date(proforma.createdAt);
    expiryDate.setDate(expiryDate.getDate() + (proforma.validityDays || 7));
    const formattedExpiry = expiryDate.toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    const materialSummary = [...new Set(items.map((i: any) => i.description))].join(', ');

    const itemRows = items.map((item: any) => [
      { text: item.description, fontSize: 10 },
      { text: item.unit || 'PCS', alignment: 'center', fontSize: 10 },
      { text: String(item.quantity), alignment: 'center', fontSize: 10 },
      { text: `${Number(item.unitPrice).toLocaleString()} ETB`, alignment: 'right', fontSize: 10 },
      { text: `${Number(item.total).toLocaleString()} ETB`, alignment: 'right', fontSize: 10 },
    ]);

    const content: any[] = [
      // ── Header Banner ──
      {
        table: {
          widths: ['*'],
          heights: [80],
          body: [[
            {
              table: {
                widths: ['*'],
                heights: [74],
                body: [[
                  {
                    text: companySettings.name,
                    style: 'companyName',
                    margin: [0, 18, 0, 0],
                  },
                ]],
              },
              layout: {
                hLineWidth: () => 0,
                vLineWidth: () => 0,
                fillColor: () => '#5C3A21',
              },
            },
          ]],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          fillColor: () => '#C8913A',
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 0],
      },

      // ── Company details row ──
      {
        columns: [
          {
            width: '*',
            text: [
              { text: companySettings.address, fontSize: 9, color: '#666' },
              { text: ' | ', fontSize: 9, color: '#999' },
              { text: companySettings.phone, fontSize: 9, color: '#666' },
              { text: ' | ', fontSize: 9, color: '#999' },
              { text: companySettings.email, fontSize: 9, color: '#666' },
            ],
            alignment: 'center',
            margin: [0, 8, 0, 0],
          },
        ],
      },
      {
        columns: [
          {
            width: '*',
            text: `TIN: ${companySettings.tin}`,
            fontSize: 9,
            color: '#666',
            alignment: 'center',
            margin: [0, 2, 0, 0],
          },
        ],
      },

      // ── PROFORMA INVOICE title ──
      { text: 'PROFORMA INVOICE', style: 'proformaTitle', margin: [0, 15, 0, 5] },

      // ── Right-aligned proforma details ──
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            text: [
              { text: 'Ref: ', bold: true, fontSize: 10 },
              { text: `${proforma.proformaNumber}\n`, fontSize: 10 },
              { text: 'Date: ', bold: true, fontSize: 10 },
              { text: `${formattedDate}\n`, fontSize: 10 },
              { text: 'Valid Until: ', bold: true, fontSize: 10 },
              { text: `${formattedExpiry}\n`, fontSize: 10 },
              ...(proforma.projectNumber
                ? [{ text: 'Project: ', bold: true, fontSize: 10 }, { text: `${proforma.projectNumber}\n`, fontSize: 10 }]
                : []),
              { text: 'Status: ', bold: true, fontSize: 10 },
              { text: proforma.status?.toUpperCase() || 'DRAFT', fontSize: 10, color: '#C8913A' },
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 15],
      },

      // ── Subject ──
      ...(proforma.subject
        ? [{
            text: proforma.subject,
            bold: true,
            fontSize: 13,
            alignment: 'center',
            decoration: 'underline',
            margin: [0, 5, 0, 15],
          }]
        : []),

      // ── Billed To / Material box ──
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              {
                text: [
                  { text: 'BILLED TO\n', bold: true, fontSize: 8, color: '#999' },
                  { text: proforma.billedToName, bold: true, fontSize: 11 },
                  ...(proforma.billedToPhone ? [{ text: `\nPhone: ${proforma.billedToPhone}`, fontSize: 10 }] : []),
                  ...(proforma.billedToAddress ? [{ text: `\n${proforma.billedToAddress}`, fontSize: 10 }] : []),
                  ...(proforma.billedToTin ? [{ text: `\nTIN: ${proforma.billedToTin}`, fontSize: 10 }] : []),
                ],
                margin: [10, 8, 10, 8],
              },
              {
                text: [
                  { text: 'MATERIAL\n', bold: true, fontSize: 8, color: '#999' },
                  { text: materialSummary || '—', fontSize: 10 },
                ],
                margin: [10, 8, 10, 8],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#d1d5db',
          vLineColor: () => '#d1d5db',
        },
        margin: [0, 0, 0, 20],
      },

      // ── Line items table ──
      {
        table: {
          headerRows: 1,
          widths: ['*', 55, 45, 55, 70],
          body: [
            [
              { text: 'DESCRIPTION', style: 'tableHeader' },
              { text: 'UNIT', style: 'tableHeader', alignment: 'center' },
              { text: 'QTY', style: 'tableHeader', alignment: 'center' },
              { text: 'RATE', style: 'tableHeader', alignment: 'right' },
              { text: 'AMOUNT', style: 'tableHeader', alignment: 'right' },
            ],
            ...itemRows,
          ],
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 || i === 1) ? 1 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#d1d5db',
          vLineColor: () => '#d1d5db',
          fillColor: (i: number) => (i === 0) ? '#f9fafb' : (i % 2 === 0 ? '#f9fafb' : null),
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 0, 0, 15],
      },

      // ── Totals box (right-aligned) ──
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 220,
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: 'Subtotal', fontSize: 10, color: '#666' },
                  { text: `${Number(proforma.subtotal).toLocaleString()} ETB`, fontSize: 10, alignment: 'right' },
                ],
                ...(Number(proforma.discountAmount) > 0
                  ? [[
                      { text: 'Discount', fontSize: 10, color: '#666' },
                      { text: `-${Number(proforma.discountAmount).toLocaleString()} ETB`, fontSize: 10, alignment: 'right', color: '#16a34a' },
                    ]]
                  : []),
                [
                  { text: `VAT (${proforma.vatRate}%)`, fontSize: 10, color: '#666' },
                  { text: `${Number(proforma.vatAmount).toLocaleString()} ETB`, fontSize: 10, alignment: 'right' },
                ],
                [
                  { text: 'TOTAL', bold: true, fontSize: 12 },
                  { text: `${Number(proforma.totalAmount).toLocaleString()} ETB`, bold: true, fontSize: 12, alignment: 'right' },
                ],
              ],
            },
            layout: {
              hLineWidth: (i: number) => (i === 0 || i === 4) ? 1 : 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#d1d5db',
              vLineColor: () => '#d1d5db',
              fillColor: (i: number) => (i === 4) ? '#f9fafb' : null,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 5,
              paddingBottom: () => 5,
            },
          },
        ],
        margin: [0, 0, 0, 15],
      },

      // ── Validity note ──
      {
        text: proforma.validityDays === 1
          ? `This pro-forma is valid only for ${proforma.validityDays} day`
          : `This pro-forma is valid only for ${proforma.validityDays || 7} days`,
        fontSize: 9,
        color: '#999',
        italics: true,
        alignment: 'center',
        margin: [0, 5, 0, 20],
      },

      // ── Notes ──
      ...(proforma.notes
        ? [{
            text: [
              { text: 'Notes & Terms\n', bold: true, fontSize: 11 },
              { text: proforma.notes, fontSize: 10 },
            ],
            margin: [0, 0, 0, 20],
          }]
        : []),

      // ── Signature block ──
      {
        text: 'Yours sincerely,',
        fontSize: 10,
        color: '#374151',
        margin: [0, 10, 0, 0],
      },
      {
        text: companyInfo.signatory_name || '',
        fontSize: 10,
        bold: true,
        margin: [0, 40, 0, 0],
      },

      // ── Bank details ──
      ...(companySettings.bankName
        ? [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#d1d5db' }], margin: [0, 25, 0, 10] },
            {
              text: [
                { text: 'Payment Information\n', bold: true, fontSize: 11 },
                { text: `Bank: ${companySettings.bankName}\n`, fontSize: 10 },
                { text: `Account: ${companySettings.bankAccountNumber}\n`, fontSize: 10 },
                { text: `Name: ${companySettings.bankAccountName}`, fontSize: 10 },
              ],
              margin: [0, 0, 0, 15],
            },
          ]
        : []),

      // ── Footer ──
      {
        text: 'Thank you for your business!',
        fontSize: 10,
        bold: true,
        alignment: 'center',
        margin: [0, 10, 0, 8],
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#d1d5db' }],
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          {
            width: '*',
            text: [
              { text: `${companySettings.name}`, fontSize: 8, color: '#999' },
              { text: ` | ${companySettings.phone}`, fontSize: 8, color: '#999' },
            ],
            alignment: 'center',
          },
        ],
      },
      {
        columns: [
          {
            width: '*',
            text: companySettings.email,
            fontSize: 8,
            color: '#999',
            alignment: 'center',
            margin: [0, 2, 0, 0],
          },
        ],
      },
    ];

    return {
      content,
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      styles: {
        companyName: { fontSize: 20, bold: true, color: '#ffffff', alignment: 'center' },
        proformaTitle: { fontSize: 16, bold: true, color: '#5C3A21', alignment: 'center' },
        tableHeader: { fontSize: 8, bold: true, color: '#6b7280', fillColor: '#f9fafb' },
      },
      pageMargins: [30, 20, 30, 30] as [number, number, number, number],
    };
  }
}
