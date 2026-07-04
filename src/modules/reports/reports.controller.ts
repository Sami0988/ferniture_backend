import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get dashboard summary' })
  getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('projects')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getProjectStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getProjectStats(startDate, endDate);
  }

  @Get('revenue')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRevenueReport(startDate, endDate);
  }

  @Get('customers')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get customer report' })
  getCustomerReport() {
    return this.reportsService.getCustomerReport();
  }

  @Get('overdue')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get overdue projects' })
  getOverdueProjects() {
    return this.reportsService.getOverdueProjects();
  }

  @Get('employee-performance')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get employee performance report' })
  getEmployeePerformance() {
    return this.reportsService.getEmployeePerformance();
  }
}
