import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { ProjectStatusService } from './project-status.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
  CreateProjectAttachmentDto,
} from './dto/project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly statusService: ProjectStatusService,
  ) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all projects' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'division', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('division') division?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.projectsService.findAll(pagination, { status, division, priority, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Get project status history' })
  getStatusHistory(@Param('id') id: string) {
    return this.projectsService.getStatusHistory(id);
  }

  @Get(':id/assignees')
  @ApiOperation({ summary: 'Get project assignees' })
  getAssignees(@Param('id') id: string) {
    return this.projectsService.getAssignees(id);
  }

  @Post(':id/assignees/:employeeId')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Assign employee to project' })
  addAssignee(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.projectsService.addAssignee(id, employeeId);
  }

  @Delete(':id/assignees/:employeeId')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Remove employee from project' })
  removeAssignee(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.projectsService.removeAssignee(id, employeeId);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create a new project' })
  create(@Body() dto: CreateProjectDto, @CurrentUser('id') userId: string) {
    return this.projectsService.create(dto, dto.assigneeIds || [], userId);
  }

  @Put(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update project' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const { assigneeIds, ...data } = dto;
    return this.projectsService.update(id, data, assigneeIds);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update project status (validated transitions)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.statusService.transitionStatus(id, dto.status, userId, dto.notes);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Get project attachments' })
  getAttachments(@Param('id') id: string) {
    return this.projectsService.getAttachments(id);
  }

  @Post(':id/attachments')
  @Roles('super_admin', 'manager', 'employee')
  @ApiOperation({ summary: 'Add attachment to project' })
  addAttachment(
    @Param('id') id: string,
    @Body() dto: CreateProjectAttachmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.addAttachment(id, dto, userId);
  }

  @Delete(':id/attachments/:attachmentId')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Delete project attachment' })
  deleteAttachment(
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.projectsService.deleteAttachment(attachmentId);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete project' })
  remove(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }
}
