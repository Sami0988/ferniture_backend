import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all employees' })
  findAll(@Query() pagination: PaginationDto) {
    return this.employeesService.findAll(pagination);
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get employee by ID' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create a new employee' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Put(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update employee' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    const { isActive, ...rest } = dto;
    const userData: any = {};
    const profileData: any = {};
    if (rest.fullName !== undefined) userData.fullName = rest.fullName;
    if (rest.phone !== undefined) userData.phone = rest.phone;
    if (rest.email !== undefined) userData.email = rest.email;
    if (rest.specialty !== undefined) profileData.specialty = rest.specialty;
    if (rest.hireDate !== undefined) profileData.hireDate = rest.hireDate;
    if (rest.idNumber !== undefined) profileData.idNumber = rest.idNumber;
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
