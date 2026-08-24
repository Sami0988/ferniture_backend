import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PaymentLettersRepository } from './payment-letters.repository';
import { UploadsService } from '../uploads/uploads.service';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { LetterTemplatesRepository } from '../letter-templates/letter-templates.repository';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { generatePdfBuffer } from '../../common/services/pdf.service';

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

    const docDefinition = this.buildLetterDocDefinition(letter, companyInfo);
    const pdfBuffer = await generatePdfBuffer(docDefinition);

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

    return pdfBuffer;
  }

  private buildLetterDocDefinition(letter: any, companyInfo: Record<string, string>) {
    const companyName = companyInfo.company_name || 'Kassahun Wood and Aluminum Work';
    const companyPhone = companyInfo.company_phone || '';
    const companyEmail = companyInfo.company_email || '';
    const signatoryName = companyInfo.signatory_name || companyName;
    const bankName = companyInfo.bank_name || '';
    const bankAccountNumber = companyInfo.bank_account_number || '';
    const bankAccountName = companyInfo.bank_account_name || '';

    const formattedDate = new Date(letter.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    const formattedDueDate = letter.dueDate
      ? new Date(letter.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

    const totalPrice = Number(letter.projectTotalPrice || 0);
    const totalPaid = Number(letter.projectTotalPaid || 0);
    const balanceDue = Number(letter.projectBalanceDue || 0);

    const bodyParagraphs = letter.body
      .split('\n\n')
      .map((p: string) => ({ text: p, margin: [0, 0, 0, 8], alignment: 'justify' as const }));

    const content: any[] = [
      { text: companyName, style: 'companyName' },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#4a2c0a' }], margin: [0, 5, 0, 15] },
      { text: `Date: ${formattedDate}`, alignment: 'right', margin: [0, 0, 0, 10] },
    ];

    if (letter.letterNumber) {
      content.push({ text: [{ text: 'Ref: ', bold: true }, letter.letterNumber], margin: [0, 0, 0, 3] });
    }
    if (formattedDueDate) {
      content.push({ text: [{ text: 'Payment Due: ', bold: true }, formattedDueDate], margin: [0, 0, 0, 10] });
    }

    const projectDetails: any[] = [
      { text: 'Project Details', style: 'sectionHeader' },
      { text: [{ text: 'Project: ', bold: true }, `${letter.projectNumber || ''} — ${letter.projectTitle || ''}`], margin: [0, 0, 0, 3] },
      { text: [{ text: 'Total Amount: ', bold: true }, `${totalPrice.toLocaleString()} ETB`], margin: [0, 0, 0, 3] },
      { text: [{ text: 'Paid: ', bold: true }, `${totalPaid.toLocaleString()} ETB`], margin: [0, 0, 0, 3] },
      { text: [{ text: 'Balance Due: ', bold: true }, `${balanceDue.toLocaleString()} ETB`], margin: [0, 0, 0, 10] },
    ];
    content.push(...projectDetails);

    const recipientLines: any[] = [{ text: 'To', margin: [0, 0, 0, 3] }];
    recipientLines.push({ text: letter.recipientCompanyName, bold: true, margin: [0, 0, 0, 2] });
    if (letter.recipientTitle) recipientLines.push({ text: letter.recipientTitle, margin: [0, 0, 0, 2] });
    if (letter.recipientAddress) {
      letter.recipientAddress.split('\n').forEach((line: string) => {
        recipientLines.push({ text: line, margin: [0, 0, 0, 2] });
      });
    }
    content.push(...recipientLines, { text: '', margin: [0, 0, 0, 10] });

    content.push(
      { text: [{ text: 'Subject: ', bold: true }, { text: letter.subject, decoration: 'underline' }], margin: [0, 0, 0, 15], alignment: 'center' },
      ...bodyParagraphs,
    );

    if (bankName) {
      content.push(
        { text: '', margin: [0, 15, 0, 0] },
        { text: [{ text: 'Bank Details:\n', bold: true }, `Bank: ${bankName}  |  Account: ${bankAccountNumber}  |  Name: ${bankAccountName}`], margin: [0, 0, 0, 15] },
      );
    }

    content.push(
      { text: '', margin: [0, 30, 0, 0] },
      { text: 'Thank you for your cooperation.', alignment: 'right', margin: [0, 0, 0, 5] },
      { text: 'Yours sincerely,', alignment: 'right', margin: [0, 0, 0, 5] },
      { text: signatoryName, alignment: 'right', bold: true, margin: [0, 0, 0, 20] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#ccc' }], margin: [0, 10, 0, 5] },
      { columns: [
        { text: `Phone: ${companyPhone}`, fontSize: 9, color: '#666' },
        { text: `Email: ${companyEmail}`, fontSize: 9, color: '#666', alignment: 'right' },
      ]},
    );

    return {
      content,
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      styles: {
        companyName: { fontSize: 18, bold: true, color: '#4a2c0a', margin: [0, 0, 0, 5] },
        sectionHeader: { fontSize: 12, bold: true, margin: [0, 5, 0, 5] },
      },
      pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    };
  }
}
