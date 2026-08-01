import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseInterceptors,
  UploadedFiles, Header,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProjectsToSellService } from './projects-to-sell.service';
import {
  CreateProjectToSellDto,
  UpdateProjectToSellDto,
  ProjectsToSellQueryDto,
} from './dto/projects-to-sell.dto';

// ==================== PUBLIC ====================

@ApiTags('Store - Projects To Sell')
@Controller('store/projects-to-sell')
export class PublicProjectsToSellController {
  constructor(private readonly ptsService: ProjectsToSellService) {}

  @Get()
  @Public()
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'List projects for sale (public)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'division', required: false, enum: ['furniture', 'aluminum', 'interior_design'] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('division') division?: string,
  ) {
    if (page || limit) {
      const p = page ? parseInt(page) : undefined;
      const l = limit ? parseInt(limit) : undefined;
      return this.ptsService.getPublicPaginated(p, l, division);
    }
    return this.ptsService.getPublic(division);
  }

  @Get(':id')
  @Public()
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'Get project for sale by ID (public)' })
  findOne(@Param('id') id: string) {
    return this.ptsService.findById(id);
  }
}

// ==================== ADMIN ====================

@ApiTags('Admin - Projects To Sell')
@ApiBearerAuth()
@Controller('admin/projects-to-sell')
export class AdminProjectsToSellController {
  constructor(private readonly ptsService: ProjectsToSellService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all projects for sale (admin)' })
  findAll(@Query() query: ProjectsToSellQueryDto) {
    const { division, type, search, ...pagination } = query;
    return this.ptsService.findAll(pagination, { division, type, search });
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get project for sale by ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.ptsService.findById(id);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Create project for sale' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', example: 'Dining Table' },
        division: { type: 'string', enum: ['furniture', 'aluminum', 'interior_design'] },
        price: { type: 'number' },
        isActive: { type: 'boolean', default: true },
        image: { type: 'string', format: 'binary' },
      },
      required: ['name', 'type', 'division', 'price'],
    },
  })
  create(
    @Body() dto: CreateProjectToSellDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[] },
  ) {
    return this.ptsService.create(dto, files);
  }

  @Put(':id')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Update project for sale' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string' },
        division: { type: 'string', enum: ['furniture', 'aluminum', 'interior_design'] },
        price: { type: 'number' },
        isActive: { type: 'boolean' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectToSellDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[] },
  ) {
    return this.ptsService.update(id, dto, files);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete project for sale' })
  remove(@Param('id') id: string) {
    return this.ptsService.delete(id);
  }
}
