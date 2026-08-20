import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentLettersService } from './payment-letters.service';
import { CreatePaymentLetterDto, UpdatePaymentLetterDto, QueryPaymentLettersDto } from './dto/payment-letter.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { convertInputDates, convertDatesInObject } from '../../common/utils/date-converter.util';

@ApiTags('Payment Letters')
@ApiBearerAuth()
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
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get payment letter by ID' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'] })
  async findOne(
    @Param('id') id: string,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const result = await this.paymentLettersService.findById(id);
    if (calendar === 'ec' && result) {
      return convertDatesInObject(result, calendar, ['dueDate', 'createdAt', 'updatedAt']);
    }
    return result;
  }

  @Get(':id/pdf')
  @Roles('super_admin', 'manager')
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
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'], description: 'Send dates in EC format' })
  create(
    @Body() dto: CreatePaymentLetterDto,
    @CurrentUser('id') userId: string,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const convertedDto = convertInputDates(dto as any, calendar, ['dueDate']);
    return this.paymentLettersService.create(convertedDto, userId);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update payment letter (draft only)' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'] })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentLetterDto,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const convertedDto = convertInputDates(dto as any, calendar, ['dueDate']);
    return this.paymentLettersService.update(id, convertedDto);
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
