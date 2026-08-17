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
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SuppliersService } from './suppliers.service';
import {
  createSupplierSchema,
  updateSupplierSchema,
} from '../tax/validation.schema';
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
} from '../tax/validation.schema';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all suppliers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.suppliersService.findAll(pagination, { search });
  }

  @Get('search')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Search suppliers by name or TIN' })
  @ApiQuery({ name: 'q', type: String })
  search(@Query('q') term: string) {
    return this.suppliersService.search(term);
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create supplier' })
  create(@Body(new ZodValidationPipe(createSupplierSchema)) dto: CreateSupplierInput) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update supplier' })
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSupplierSchema)) dto: UpdateSupplierInput) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete supplier' })
  remove(@Param('id') id: string) {
    return this.suppliersService.delete(id);
  }
}
