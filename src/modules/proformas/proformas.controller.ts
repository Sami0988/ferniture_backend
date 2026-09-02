import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProformasService } from './proformas.service';
import {
  CreateProformaDto,
  UpdateProformaDto,
  QueryProformasDto,
} from './dto/proforma.dto';

@ApiTags('Proformas')
@ApiBearerAuth()
@Controller('proformas')
export class ProformasController {
  constructor(private readonly proformasService: ProformasService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all proformas' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'sent', 'accepted', 'expired', 'cancelled'] })
  findAll(@Query() query: QueryProformasDto) {
    const { projectId, customerId, status, page, limit } = query;
    return this.proformasService.findAll({ page, limit }, { projectId, customerId, status });
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get proforma by ID' })
  findOne(@Param('id') id: string) {
    return this.proformasService.findById(id);
  }

  @Get(':id/pdf')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Download proforma PDF' })
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.proformasService.generatePdfBuffer(id);
    const proforma = await this.proformasService.findById(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${proforma.proformaNumber}.pdf"`,
      'Cache-Control': 'no-cache',
    });

    res.end(pdfBuffer);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create a proforma' })
  create(@Body() dto: CreateProformaDto, @CurrentUser('id') userId: string) {
    return this.proformasService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update proforma (draft only for items)' })
  update(@Param('id') id: string, @Body() dto: UpdateProformaDto) {
    return this.proformasService.update(id, dto);
  }

  @Post(':id/send')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Mark proforma as sent (locks edits)' })
  markAsSent(@Param('id') id: string) {
    return this.proformasService.markAsSent(id);
  }

  @Post(':id/accept')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Mark proforma as accepted' })
  markAsAccepted(@Param('id') id: string) {
    return this.proformasService.markAsAccepted(id);
  }

  @Post(':id/cancel')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Cancel proforma' })
  cancel(@Param('id') id: string) {
    return this.proformasService.cancel(id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete proforma (draft only)' })
  remove(@Param('id') id: string) {
    return this.proformasService.delete(id);
  }
}
