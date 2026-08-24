import { Controller, Get, Query, Res, UsePipes } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import ExcelJS from 'exceljs';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TaxReportService } from './tax-report.service';
import { generatePdfBuffer } from '../../common/services/pdf.service';
import { taxReportQuerySchema } from '../tax/validation.schema';
import type { TaxReportQueryInput } from '../tax/validation.schema';

@ApiTags('Tax Report')
@ApiBearerAuth()
@Controller('tax-report')
export class TaxReportController {
  constructor(private readonly taxReportService: TaxReportService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @UsePipes(new ZodValidationPipe(taxReportQuerySchema))
  @ApiOperation({ summary: 'Get tax report for a period' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'quarter', 'year', 'custom'], required: false })
  @ApiQuery({ name: 'referenceDate', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'calendar', enum: ['gc', 'ec', 'ec-fiscal'], required: false, description: 'gc=Gregorian, ec=Ethiopian calendar year, ec-fiscal=Ethiopian fiscal year (Hamle–Sene)' })
  @ApiQuery({ name: 'fiscalYear', required: false, description: 'Ethiopian fiscal year (e.g. 2018). Only with calendar=ec-fiscal.' })
  @ApiQuery({ name: 'fiscalMonth', required: false, description: 'Fiscal month 1-12. Only with calendar=ec-fiscal & period=month.' })
  @ApiQuery({ name: 'quarter', required: false, description: 'Quarter 1-4. Only with period=quarter.' })
  getReport(@Query() query: TaxReportQueryInput) {
    return this.taxReportService.getTaxReport(query);
  }

  @Get('export')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Export tax report as CSV, XLSX, or PDF' })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'referenceDate', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'calendar', enum: ['gc', 'ec', 'ec-fiscal'], required: false })
  @ApiQuery({ name: 'fiscalYear', required: false, description: 'Ethiopian fiscal year (e.g. 2018 for FY2018). Only valid with calendar=ec-fiscal.' })
  @ApiQuery({ name: 'fiscalMonth', required: false, description: 'Fiscal month 1-12. Only valid with calendar=ec-fiscal and period=month.' })
  @ApiQuery({ name: 'quarter', required: false, description: 'Quarter 1-4. Only valid with period=quarter.' })
  @ApiQuery({ name: 'format', enum: ['csv', 'xlsx', 'pdf'], required: true })
  async export(
    @Query() query: TaxReportQueryInput & { format: string },
    @Res() res: Response,
  ) {
    const report = await this.taxReportService.getTaxReport(query);

    if (query.format === 'csv') {
      const csv = this.buildCsv(report);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=tax-report-${report.period.from}-to-${report.period.to}.csv`,
      );
      return res.send(csv);
    }

    if (query.format === 'xlsx') {
      const xlsxBuffer = await this.buildXlsx(report);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=tax-report-${report.period.from}-to-${report.period.to}.xlsx`,
      );
      return res.send(xlsxBuffer);
    }

    if (query.format === 'pdf') {
      const pdfBuffer = await this.buildPdf(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=tax-report-${report.period.from}-to-${report.period.to}.pdf`,
      );
      return res.send(pdfBuffer);
    }

    res
      .status(400)
      .json({ message: 'Invalid format. Use "csv", "xlsx", or "pdf".' });
  }

  /**
   * Safely formats a single CSV cell.
   * - Numeric-looking values (possibly with thousands separators, e.g. "22,826.00")
   *   have their separator commas stripped so they export as raw numbers.
   * - Any other value that contains a comma, quote, or newline is wrapped in
   *   quotes with internal quotes doubled, per RFC 4180 — nothing is deleted.
   */
  private csvField(value: unknown): string {
    if (value === null || value === undefined) return '';

    let str = String(value);

    // Only strip commas when the whole field is a formatted number
    // (e.g. "22,826", "1,234.50", "-500"). Leaves text fields untouched.
    if (/^-?[\d,]+(\.\d+)?$/.test(str)) {
      str = str.replace(/,/g, '');
    }

    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  private csvRow(fields: unknown[]): string {
    return fields.map((f) => this.csvField(f)).join(',');
  }

  private buildCsv(report: any): string {
    const lines: string[] = [];

    lines.push(this.csvRow(['Tax Report']));
    lines.push(this.csvRow(['Period', report.period.label]));
    lines.push(
      this.csvRow([
        'Date Range',
        `${report.period.from} to ${report.period.to}`,
      ]),
    );
    lines.push('');

    lines.push(this.csvRow(['PURCHASES (Input VAT)']));
    lines.push(
      this.csvRow(['Total Before VAT', report.purchases.totalBeforeVat]),
    );
    lines.push(this.csvRow(['Total VAT (Input)', report.purchases.totalVat]));
    lines.push(
      this.csvRow(['Total Withholding', report.purchases.totalWithholding]),
    );
    lines.push(this.csvRow(['Count', report.purchases.count]));
    lines.push('');

    lines.push(this.csvRow(['WORK PROJECTS (Output VAT)']));
    lines.push(
      this.csvRow(['Total Before VAT', report.workProjects.totalBeforeVat]),
    );
    lines.push(
      this.csvRow(['Total VAT (Output)', report.workProjects.totalVat]),
    );
    lines.push(this.csvRow(['Count', report.workProjects.count]));
    lines.push('');

    lines.push(this.csvRow(['VAT SUMMARY']));
    lines.push(this.csvRow(['Output VAT', report.vatSummary.outputVat]));
    lines.push(this.csvRow(['Input VAT', report.vatSummary.inputVat]));
    lines.push(this.csvRow(['Net VAT', report.vatSummary.netVat]));
    lines.push(this.csvRow(['Status', report.vatSummary.status]));
    lines.push('');

    lines.push(this.csvRow(['WITHHOLDING SUMMARY']));
    lines.push(
      this.csvRow(['Total Withheld', report.withholdingSummary.totalWithheld]),
    );
    lines.push('');

    if (report.breakdown.purchases.length > 0) {
      lines.push(this.csvRow(['PURCHASE BREAKDOWN']));
      lines.push(
        this.csvRow([
          'ID',
          'Supplier',
          'FS Number',
          'Date',
          'Before VAT',
          'VAT',
          'Withholding',
          'Total',
        ]),
      );
      for (const p of report.breakdown.purchases) {
        lines.push(
          this.csvRow([
            p.id,
            p.supplierName || '',
            p.fsNumber,
            p.purchaseDate,
            p.amountBeforeVat,
            p.vatAmount,
            p.withholdingAmount,
            p.totalAmount,
          ]),
        );
      }
      lines.push('');
    }

    if (report.breakdown.workProjects.length > 0) {
      lines.push(this.csvRow(['WORK PROJECT BREAKDOWN']));
      lines.push(
        this.csvRow([
          'ID',
          'Project',
          'Client',
          'Date',
          'Before VAT',
          'VAT',
          'Total',
        ]),
      );
      for (const wp of report.breakdown.workProjects) {
        lines.push(
          this.csvRow([
            wp.id,
            wp.projectName,
            wp.clientName || '',
            wp.projectDate,
            wp.priceBeforeVat,
            wp.vatAmount,
            wp.totalPrice,
          ]),
        );
      }
    }

    // BOM so Excel opens UTF-8 correctly (Amharic supplier/client names),
    // CRLF line endings for best Excel compatibility.
    return '\uFEFF' + lines.join('\r\n');
  }

  private async buildXlsx(report: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tax Report Module';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Tax Report', {
      views: [{ showGridLines: false }],
    });

    sheet.columns = [
      { key: 'a', width: 22 },
      { key: 'b', width: 18 },
      { key: 'c', width: 16 },
      { key: 'd', width: 14 },
      { key: 'e', width: 14 },
      { key: 'f', width: 14 },
      { key: 'g', width: 16 },
      { key: 'h', width: 14 },
    ];

    const isPayable = report.vatSummary.status === 'PAYABLE_TO_GOVERNMENT';
    const statusColor = isPayable ? 'FFDC3545' : 'FF28A745'; // ARGB red / green
    const statusFillLight = isPayable ? 'FFFCE8EA' : 'FFE9F7EC';
    const headerFill = 'FF1F2937'; // dark slate
    const sectionFill = 'FFE5E7EB'; // light gray
    const numberFormat = '#,##0.00';

    let row = 1;

    // --- Title ---
    sheet.mergeCells(row, 1, row, 8);
    const titleCell = sheet.getCell(row, 1);
    titleCell.value = 'Tax Report';
    titleCell.font = { bold: true, size: 18, color: { argb: 'FF111827' } };
    row += 1;

    sheet.mergeCells(row, 1, row, 8);
    const subtitleCell = sheet.getCell(row, 1);
    subtitleCell.value = `${report.period.label}  •  ${report.period.from} to ${report.period.to}`;
    subtitleCell.font = { italic: true, size: 11, color: { argb: 'FF6B7280' } };
    row += 2;

    // --- Helpers ---
    const sectionHeader = (title: string) => {
      sheet.mergeCells(row, 1, row, 8);
      const cell = sheet.getCell(row, 1);
      cell.value = title;
      cell.font = { bold: true, size: 12, color: { argb: 'FF111827' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: sectionFill },
      };
      for (let c = 1; c <= 8; c++) {
        sheet.getCell(row, c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: sectionFill },
        };
      }
      row += 1;
    };

    const kvRow = (
      label: string,
      value: number | string,
      opts?: { color?: string; format?: string },
    ) => {
      const labelCell = sheet.getCell(row, 1);
      labelCell.value = label;
      labelCell.font = { bold: true };

      const valueCell = sheet.getCell(row, 2);
      valueCell.value = value;
      if (typeof value === 'number') {
        valueCell.numFmt = opts?.format ?? numberFormat;
      }
      if (opts?.color) {
        valueCell.font = { bold: true, color: { argb: opts.color } };
      }
      row += 1;
    };

    const tableHeaderRow = (headers: string[]) => {
      headers.forEach((h, i) => {
        const cell = sheet.getCell(row, i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: headerFill },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        };
      });
      row += 1;
    };

    const tableDataRow = (
      values: (string | number)[],
      numericCols: number[],
    ) => {
      values.forEach((v, i) => {
        const cell = sheet.getCell(row, i + 1);
        cell.value = v;
        if (numericCols.includes(i)) {
          cell.numFmt = numberFormat;
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
      row += 1;
    };

    // --- SUMMARY ---
    sectionHeader('SUMMARY');
    kvRow('Output VAT', Number(report.vatSummary.outputVat));
    kvRow('Input VAT', Number(report.vatSummary.inputVat));
    kvRow('Net VAT', Number(report.vatSummary.netVat), { color: statusColor });
    kvRow('Status', report.vatSummary.status.replace(/_/g, ' '));
    sheet.getCell(row - 1, 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: statusFillLight },
    };
    sheet.getCell(row - 1, 2).font = {
      bold: true,
      color: { argb: statusColor },
    };
    kvRow('Total Withheld', Number(report.withholdingSummary.totalWithheld));
    row += 1;

    // --- PURCHASES BREAKDOWN ---
    if (report.breakdown.purchases.length > 0) {
      sectionHeader(`PURCHASES (${report.purchases.count})`);
      tableHeaderRow([
        'Supplier',
        'FS Number',
        'Date',
        'Before VAT',
        'VAT',
        'Withholding',
        'Total',
      ]);
      for (const p of report.breakdown.purchases) {
        tableDataRow(
          [
            p.supplierName || '-',
            p.fsNumber,
            p.purchaseDate,
            Number(p.amountBeforeVat),
            Number(p.vatAmount),
            Number(p.withholdingAmount),
            Number(p.totalAmount),
          ],
          [3, 4, 5, 6],
        );
      }
      row += 1;
    }

    // --- WORK PROJECTS BREAKDOWN ---
    if (report.breakdown.workProjects.length > 0) {
      sectionHeader(`WORK PROJECTS (${report.workProjects.count})`);
      tableHeaderRow([
        'Project',
        'Client',
        'Date',
        'Before VAT',
        'VAT',
        'Total',
      ]);
      for (const wp of report.breakdown.workProjects) {
        tableDataRow(
          [
            wp.projectName,
            wp.clientName || '-',
            wp.projectDate,
            Number(wp.priceBeforeVat),
            Number(wp.vatAmount),
            Number(wp.totalPrice),
          ],
          [3, 4, 5],
        );
      }
    }

    if (
      report.breakdown.purchases.length === 0 &&
      report.breakdown.workProjects.length === 0
    ) {
      sheet.getCell(row, 1).value =
        'No purchases or projects recorded in this period.';
      sheet.getCell(row, 1).font = {
        italic: true,
        color: { argb: 'FF6B7280' },
      };
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async buildPdf(report: any): Promise<Buffer> {
    const docDefinition = this.buildPdfDocDefinition(report);
    return generatePdfBuffer(docDefinition);
  }

  private buildPdfDocDefinition(report: any) {
    const statusColor =
      report.vatSummary.status === 'PAYABLE_TO_GOVERNMENT'
        ? '#dc3545'
        : '#28a745';

    const purchaseRows = report.breakdown.purchases.map((p: any) => [
      p.supplierName || '-',
      p.fsNumber,
      p.purchaseDate,
      Number(p.amountBeforeVat).toLocaleString(),
      Number(p.vatAmount).toLocaleString(),
      Number(p.withholdingAmount).toLocaleString(),
      Number(p.totalAmount).toLocaleString(),
    ]);

    const projectRows = report.breakdown.workProjects.map((wp: any) => [
      wp.projectName,
      wp.projectDate,
      Number(wp.priceBeforeVat).toLocaleString(),
      Number(wp.vatAmount).toLocaleString(),
      Number(wp.totalPrice).toLocaleString(),
    ]);

    const content: any[] = [
      { text: 'Tax Report', style: 'title' },
      {
        text: `Period: ${report.period.label} (${report.period.from} to ${report.period.to})`,
        margin: [0, 5, 0, 15],
      },
      {
        columns: [
          {
            width: '*',
            text: [
              {
                text: 'Output VAT (Work Projects)\n',
                fontSize: 10,
                color: '#666',
              },
              {
                text: `${Number(report.vatSummary.outputVat).toLocaleString()} ETB`,
                fontSize: 18,
                bold: true,
              },
            ],
          },
          {
            width: '*',
            text: [
              { text: 'Input VAT (Purchases)\n', fontSize: 10, color: '#666' },
              {
                text: `${Number(report.vatSummary.inputVat).toLocaleString()} ETB`,
                fontSize: 18,
                bold: true,
              },
            ],
          },
          {
            width: '*',
            text: [
              { text: 'Net VAT\n', fontSize: 10, color: '#666' },
              {
                text: `${Number(report.vatSummary.netVat).toLocaleString()} ETB`,
                fontSize: 18,
                bold: true,
                color: statusColor,
              },
              {
                text: `\n${report.vatSummary.status.replace(/_/g, ' ')}`,
                fontSize: 9,
                color: statusColor,
              },
            ],
          },
          {
            width: '*',
            text: [
              { text: 'Withholding Tax\n', fontSize: 10, color: '#666' },
              {
                text: `${Number(report.withholdingSummary.totalWithheld).toLocaleString()} ETB`,
                fontSize: 18,
                bold: true,
              },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },
    ];

    if (purchaseRows.length > 0) {
      content.push(
        {
          text: `Purchases (${report.purchases.count})`,
          style: 'sectionHeader',
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                'Supplier',
                'FS Number',
                'Date',
                'Before VAT',
                'VAT',
                'Withholding',
                'Total',
              ],
              ...purchaseRows,
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15],
        },
      );
    }

    if (projectRows.length > 0) {
      content.push(
        {
          text: `Work Projects (${report.workProjects.count})`,
          style: 'sectionHeader',
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              ['Project', 'Date', 'Before VAT', 'VAT', 'Total'],
              ...projectRows,
            ],
          },
          layout: 'lightHorizontalLines',
        },
      );
    }

    if (purchaseRows.length === 0 && projectRows.length === 0) {
      content.push({
        text: 'No purchases or projects recorded in this period.',
        italics: true,
        margin: [0, 10, 0, 0],
      });
    }

    return {
      content,
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      styles: {
        title: { fontSize: 20, bold: true, margin: [0, 0, 0, 10] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 8] },
      },
      pageMargins: [40, 40, 40, 40] as [number, number, number, number],
    };
  }
}
