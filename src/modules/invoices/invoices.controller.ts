import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, CreatePaymentDto } from './dto/invoice.dto';
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
  @ApiQuery({ name: 'paymentStatus', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    return this.invoicesService.findAll(pagination, { paymentStatus });
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
  @ApiOperation({ summary: 'Generate and return PDF URL' })
  async generatePdf(@Param('id') id: string) {
    const pdfUrl = await this.invoicesService.generatePdf(id);
    return { pdfUrl };
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create an invoice' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser('id') userId: string) {
    return this.invoicesService.create(dto, userId);
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
