import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PurchasesService } from './purchases.service';
import {
  createPurchaseSchema,
  updatePurchaseSchema,
} from '../tax/validation.schema';
import type {
  CreatePurchaseInput,
  UpdatePurchaseInput,
} from '../tax/validation.schema';
import { convertDatesInArray, convertInputDates } from '../../common/utils/date-converter.util';

@ApiTags('Purchases')
@ApiBearerAuth()
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all purchases' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD (GC or EC)' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD (GC or EC)' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'], description: 'Return dates in GC or EC' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('supplierId') supplierId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const result = await this.purchasesService.findAll(pagination, {
      supplierId,
      from,
      to,
    });
    return {
      ...result,
      data: convertDatesInArray(result.data || result, calendar || 'gc', ['purchaseDate']),
    };
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get purchase by ID with items' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'] })
  async findOne(
    @Param('id') id: string,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const result = await this.purchasesService.findById(id);
    if (calendar === 'ec' && result) {
      return {
        ...result,
        purchaseDate: result.purchaseDate ? convertDatesInArray([{ purchaseDate: result.purchaseDate }], 'ec', ['purchaseDate'])[0].purchaseDate : result.purchaseDate,
      };
    }
    return result;
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create purchase with items' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'], description: 'Send dates in EC format' })
  create(
    @Body(new ZodValidationPipe(createPurchaseSchema)) dto: CreatePurchaseInput,
    @CurrentUser('id') userId: string,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const convertedDto = convertInputDates(dto as any, calendar, ['purchaseDate']);
    return this.purchasesService.create(convertedDto, userId);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update purchase' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'] })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePurchaseSchema)) dto: UpdatePurchaseInput,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const convertedDto = convertInputDates(dto as any, calendar, ['purchaseDate']);
    return this.purchasesService.update(id, convertedDto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete purchase' })
  remove(@Param('id') id: string) {
    return this.purchasesService.delete(id);
  }
}
