import {
  Controller, Get, Post, Put, Delete,
  Body, Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanySettingsService } from './company-settings.service';
import {
  UpdateCompanySettingDto,
  BulkUpdateCompanySettingsDto,
} from './dto/company-settings.dto';

@ApiTags('Company Settings')
@ApiBearerAuth()
@Controller('company-settings')
export class CompanySettingsController {
  constructor(private readonly service: CompanySettingsService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get all company settings' })
  findAll() {
    return this.service.findAll();
  }

  @Get('company-info')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get company info for invoices' })
  getCompanyInfo() {
    return this.service.getCompanyInfo();
  }

  @Get(':key')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get setting by key' })
  findByKey(@Param('key') key: string) {
    return this.service.findByKey(key);
  }

  @Put()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a single setting' })
  update(@Body() dto: UpdateCompanySettingDto) {
    return this.service.upsert(dto.key, dto.value);
  }

  @Put('bulk')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Bulk update settings' })
  bulkUpdate(@Body() dto: BulkUpdateCompanySettingsDto) {
    return this.service.bulkUpdate(dto.settings);
  }

  @Delete(':key')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a setting' })
  delete(@Param('key') key: string) {
    return this.service.delete(key);
  }
}
