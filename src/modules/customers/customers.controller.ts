import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all customers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const pagination = { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 };
    return this.customersService.findAll(pagination, { type, search });
  }

  @Get('search')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Search customers' })
  @ApiQuery({ name: 'q', type: String })
  search(@Query('q') term: string) {
    return this.customersService.search(term);
  }

  @Get('export')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Export customers as CSV' })
  async export(@Res() res: Response) {
    const { csv, filename, count } = await this.customersService.exportAll();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create customer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        type: { type: 'string', enum: ['personal', 'business', 'government', 'bank'] },
        address: { type: 'string' },
        tinNumber: { type: 'string' },
        notes: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.customersService.create(dto, userId, file);
  }

  @Put(':id')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update customer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        type: { type: 'string', enum: ['personal', 'business', 'government', 'bank'] },
        address: { type: 'string' },
        tinNumber: { type: 'string' },
        notes: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.customersService.update(id, dto, file);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete customer' })
  remove(@Param('id') id: string) {
    return this.customersService.delete(id);
  }
}
