import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { convertDatesInObject, convertDatesInArray, convertInputDates } from '../../common/utils/date-converter.util';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'] })
  async getDashboardSummary(@Query('calendar') calendar?: 'gc' | 'ec') {
    const result = await this.reportsService.getDashboardSummary();
    if (calendar === 'ec' && result) {
      // Convert date fields in dashboard response
      return convertDatesInObject(result, calendar, ['today', 'startOfMonth', 'startOfYear']);
    }
    return result;
  }

  @Get('projects')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD (GC or EC)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD (GC or EC)' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'], description: 'Return dates in GC or EC' })
  async getProjectStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    // Convert EC input to GC if needed
    const convertedStart = calendar === 'ec' ? convertInputDates({ startDate }, 'ec').startDate : startDate;
    const convertedEnd = calendar === 'ec' ? convertInputDates({ endDate }, 'ec').endDate : endDate;

    const result = await this.reportsService.getProjectStats(convertedStart, convertedEnd);
    return result;
  }

  @Get('revenue')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD (GC or EC)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD (GC or EC)' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'], description: 'Return dates in GC or EC' })
  async getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const convertedStart = calendar === 'ec' ? convertInputDates({ startDate }, 'ec').startDate : startDate;
    const convertedEnd = calendar === 'ec' ? convertInputDates({ endDate }, 'ec').endDate : endDate;

    const result = await this.reportsService.getRevenueReport(convertedStart, convertedEnd);
    return result;
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
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'] })
  async getOverdueProjects(@Query('calendar') calendar?: 'gc' | 'ec') {
    const result = await this.reportsService.getOverdueProjects();
    if (calendar === 'ec' && result?.overdueProjects) {
      return {
        ...result,
        overdueProjects: convertDatesInArray(result.overdueProjects, calendar, ['orderDate', 'deliveryDate', 'createdAt']),
      };
    }
    return result;
  }

  @Get('employee-performance')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get employee performance report' })
  getEmployeePerformance() {
    return this.reportsService.getEmployeePerformance();
  }
}
