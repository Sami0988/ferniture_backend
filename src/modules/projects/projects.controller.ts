import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { ProjectStatusService } from './project-status.service';
import { ProjectPaymentsService } from './project-payments.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
  CreateProjectAttachmentDto,
  PayProjectDto,
  ProjectQueryDto,
} from './dto/project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly statusService: ProjectStatusService,
    private readonly paymentsService: ProjectPaymentsService,
  ) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all projects' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'division', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() query: ProjectQueryDto) {
    const { status, division, priority, search, ...pagination } = query;
    return this.projectsService.findAll(pagination, { status, division, priority, search });
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Get(':id/status-history')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get project status history' })
  getStatusHistory(@Param('id') id: string) {
    return this.projectsService.getStatusHistory(id);
  }

  @Get(':id/assignees')
  @Roles('super_admin', 'manager')
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
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'coverImage', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Create a new project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', format: 'uuid' },
        division: { type: 'string', enum: ['furniture', 'aluminum', 'interior_design'] },
        title: { type: 'string' },
        description: { type: 'string' },
        totalPrice: { type: 'number' },
        paidNowPrice: { type: 'number' },
        orderDate: { type: 'string', format: 'date' },
        deliveryDate: { type: 'string', format: 'date' },
        leadEmployeeId: { type: 'string', format: 'uuid' },
        branchName: { type: 'string' },
        city: { type: 'string' },
        priority: { type: 'string', enum: ['normal', 'urgent', 'vip'] },
        assigneeIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        coverImage: { type: 'string', format: 'binary' },
      },
      required: ['customerId', 'division', 'title', 'orderDate'],
    },
  })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files?: { coverImage?: Express.Multer.File[] },
  ) {
    return this.projectsService.create(dto, dto.assigneeIds || [], userId, files);
  }

  @Put(':id')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'coverImage', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Update project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        branchName: { type: 'string' },
        city: { type: 'string' },
        totalPrice: { type: 'number' },
        paidNowPrice: { type: 'number' },
        status: { type: 'string', enum: ['new', 'in_progress', 'completed', 'delivered', 'paid', 'cancelled'] },
        priority: { type: 'string', enum: ['normal', 'urgent', 'vip'] },
        deliveryDate: { type: 'string', format: 'date' },
        leadEmployeeId: { type: 'string', format: 'uuid' },
        assigneeIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        coverImage: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @UploadedFiles() files?: { coverImage?: Express.Multer.File[] },
  ) {
    const { assigneeIds, ...data } = dto;
    return this.projectsService.update(id, data, assigneeIds, files);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update project status (validated transitions)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.statusService.transitionStatus(id, dto.status, userId, dto.notes);
  }

  @Get(':id/attachments')
  @Roles('super_admin', 'manager')
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

  @Get(':id/payments')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get project payment summary and history' })
  getPayments(@Param('id') id: string) {
    return this.paymentsService.getPaymentSummary(id);
  }

  @Post(':id/pay')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Record a payment for a project' })
  addPayment(
    @Param('id') id: string,
    @Body() dto: PayProjectDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.addPayment(id, dto, userId);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete project' })
  remove(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }
}
