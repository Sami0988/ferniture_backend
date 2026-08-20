import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { convertInputDates, convertDatesInObject } from '../../common/utils/date-converter.util';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all employees' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'specialty', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('specialty') specialty?: string,
    @Query('search') search?: string,
  ) {
    const pagination = { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 };
    return this.employeesService.findAll(pagination, { specialty, search });
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'] })
  async findOne(
    @Param('id') id: string,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const result = await this.employeesService.findById(id);
    if (calendar === 'ec' && result) {
      return convertDatesInObject(result, calendar, ['hireDate']);
    }
    return result;
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'], description: 'Send dates in EC format' })
  create(
    @Body() dto: CreateEmployeeDto,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const convertedDto = convertInputDates(dto as any, calendar, ['hireDate']);
    return this.employeesService.create(convertedDto);
  }

  @Put(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update employee' })
  @ApiQuery({ name: 'calendar', required: false, enum: ['gc', 'ec'] })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @Query('calendar') calendar?: 'gc' | 'ec',
  ) {
    const { isActive, ...rest } = dto;
    const convertedRest = convertInputDates(rest as any, calendar, ['hireDate']);
    const userData: any = {};
    const profileData: any = {};
    if (convertedRest.fullName !== undefined) userData.fullName = convertedRest.fullName;
    if (convertedRest.phone !== undefined) userData.phone = convertedRest.phone;
    if (convertedRest.email !== undefined) userData.email = convertedRest.email;
    if (convertedRest.specialty !== undefined) profileData.specialty = convertedRest.specialty;
    if (convertedRest.hireDate !== undefined) profileData.hireDate = convertedRest.hireDate;
    if (convertedRest.idNumber !== undefined) profileData.idNumber = convertedRest.idNumber;
    return this.employeesService.update(id, userData, profileData);
  }

  @Patch(':id/activate')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Activate employee' })
  activate(@Param('id') id: string) {
    return this.employeesService.setActive(id, true);
  }

  @Patch(':id/deactivate')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Deactivate employee' })
  deactivate(@Param('id') id: string) {
    return this.employeesService.setActive(id, false);
  }

  @Get(':id/projects')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get employee project history' })
  getProjectHistory(@Param('id') id: string) {
    return this.employeesService.getProjectHistory(id);
  }

  @Get(':id/workload')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get employee workload/capacity' })
  getWorkload(@Param('id') id: string) {
    return this.employeesService.getWorkload(id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete employee' })
  remove(@Param('id') id: string) {
    return this.employeesService.delete(id);
  }
}
