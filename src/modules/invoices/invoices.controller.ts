import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, CreatePaymentDto, InvoiceQueryDto } from './dto/invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all invoices' })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['unpaid', 'partial', 'paid'] })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() query: InvoiceQueryDto) {
    const { paymentStatus, search, ...pagination } = query;
    return this.invoicesService.findAll(pagination, { paymentStatus, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Get payments for an invoice' })
  getPayments(@Param('id') id: string) {
    return this.invoicesService.getPayments(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download invoice PDF' })
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.invoicesService.generatePdfBuffer(id);
    const invoice = await this.invoicesService.findById(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
      'Cache-Control': 'no-cache',
    });
    
    res.end(pdfBuffer);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create an invoice' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser('id') userId: string) {
    return this.invoicesService.create(dto, userId);
  }

  @Post('from-project/:projectId')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create invoice from project (auto-fills from project price)' })
  createFromProject(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.invoicesService.createFromProject(projectId, userId);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update invoice details' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateInvoiceDto>) {
    return this.invoicesService.update(id, dto);
  }

  @Patch(':id/items')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update invoice line items' })
  updateItems(
    @Param('id') id: string,
    @Body() body: { items: { description: string; quantity: number; unitPrice: number }[] },
  ) {
    return this.invoicesService.updateItems(id, body.items);
  }

  @Post(':id/email')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Email invoice to customer' })
  emailInvoice(@Param('id') id: string) {
    return this.invoicesService.emailInvoice(id);
  }

  @Post(':id/payments')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Record a payment' })
  addPayment(
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.invoicesService.addPayment(id, dto, userId);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete invoice' })
  remove(@Param('id') id: string) {
    return this.invoicesService.delete(id);
  }
}
