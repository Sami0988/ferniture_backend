import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentLettersService } from './payment-letters.service';
import { CreatePaymentLetterDto, UpdatePaymentLetterDto, QueryPaymentLettersDto } from './dto/payment-letter.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Payment Letters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payment-letters')
export class PaymentLettersController {
  constructor(private readonly paymentLettersService: PaymentLettersService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all payment letters' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'sent', 'paid'] })
  findAll(@Query() query: QueryPaymentLettersDto & PaginationDto) {
    const { projectId, customerId, status, ...pagination } = query;
    return this.paymentLettersService.findAll(pagination, { projectId, customerId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment letter by ID' })
  findOne(@Param('id') id: string) {
    return this.paymentLettersService.findById(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download payment letter PDF' })
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.paymentLettersService.generatePdfBuffer(id);
    const letter = await this.paymentLettersService.findById(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${letter.letterNumber}.pdf"`,
      'Cache-Control': 'no-cache',
    });

    res.end(pdfBuffer);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create a payment letter' })
  create(@Body() dto: CreatePaymentLetterDto, @CurrentUser('id') userId: string) {
    return this.paymentLettersService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update payment letter (draft only)' })
  update(@Param('id') id: string, @Body() dto: UpdatePaymentLetterDto) {
    return this.paymentLettersService.update(id, dto);
  }

  @Post(':id/send')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Mark payment letter as sent (locks edits)' })
  markAsSent(@Param('id') id: string) {
    return this.paymentLettersService.markAsSent(id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete payment letter (draft only)' })
  remove(@Param('id') id: string) {
    return this.paymentLettersService.delete(id);
  }
}
