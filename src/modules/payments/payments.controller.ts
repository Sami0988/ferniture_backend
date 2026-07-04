import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all payments' })
  @ApiQuery({ name: 'method', required: false })
  @ApiQuery({ name: 'invoiceId', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('method') method?: string,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.paymentsService.findAll(pagination, { method, invoiceId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Record a payment' })
  create(
    @Body() dto: {
      invoiceId: string;
      amount: number;
      method: string;
      referenceNumber?: string;
      paidAt: string;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.create({ ...dto, verifiedBy: userId });
  }

  @Patch(':id/verify')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Verify a payment' })
  verify(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.verify(id, userId);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a payment' })
  remove(@Param('id') id: string) {
    return this.paymentsService.delete(id);
  }
}
