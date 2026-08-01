import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseInterceptors,
  UploadedFiles, Header,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { GalleryProjectService } from './gallery-project.service';
import {
  CreateGalleryProjectDto,
  UpdateGalleryProjectDto,
  GalleryProjectQueryDto,
} from './dto/gallery-project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

// ==================== PUBLIC (no auth) ====================

@ApiTags('Gallery Project')
@Controller('gallery-project')
export class PublicGalleryProjectController {
  constructor(private readonly galleryProjectService: GalleryProjectService) {}

  @Get()
  @Public()
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'List gallery project images for landing page (public)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'division', required: false, enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('division') division?: string,
  ) {
    const pagination = { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 };
    return this.galleryProjectService.findAll(pagination, { division });
  }
}

// ==================== ADMIN (auth required) ====================

@ApiTags('Admin - Gallery Project')
@ApiBearerAuth()
@Controller('admin/gallery-project')
export class AdminGalleryProjectController {
  constructor(private readonly galleryProjectService: GalleryProjectService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all gallery project images' })
  findAll(@Query() query: GalleryProjectQueryDto) {
    const { division, projectId, search, ...pagination } = query;
    return this.galleryProjectService.findAll(pagination, { division, projectId, search });
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get gallery project image by ID' })
  findOne(@Param('id') id: string) {
    return this.galleryProjectService.findById(id);
  }

  @Get('project/:projectId')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get all gallery images for a specific project' })
  @ApiQuery({ name: 'projectId', required: true })
  findByProject(@Param('projectId') projectId: string) {
    return this.galleryProjectService.findByProjectId(projectId);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Create a gallery project image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Living Room Renovation' },
        division: { type: 'string', enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] },
        imageUrl: { type: 'string', example: 'https://example.com/image.jpg' },
        roomType: { type: 'string', example: 'living_room' },
        aspect: { type: 'string', enum: ['tall', 'wide', 'square'], default: 'square' },
        projectId: { type: 'string', format: 'uuid', description: 'UUID of the associated project' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['division', 'imageUrl'],
    },
  })
  create(
    @Body() dto: CreateGalleryProjectDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[] },
  ) {
    return this.galleryProjectService.create(dto, files);
  }

  @Put(':id')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Update a gallery project image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        division: { type: 'string', enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] },
        imageUrl: { type: 'string' },
        roomType: { type: 'string' },
        aspect: { type: 'string', enum: ['tall', 'wide', 'square'] },
        projectId: { type: 'string', format: 'uuid' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGalleryProjectDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[] },
  ) {
    return this.galleryProjectService.update(id, dto, files);
  }

  @Put(':id/feature')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Toggle gallery project image featured status' })
  toggleFeatured(@Param('id') id: string) {
    return this.galleryProjectService.toggleFeatured(id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a gallery project image' })
  remove(@Param('id') id: string) {
    return this.galleryProjectService.delete(id);
  }
}
