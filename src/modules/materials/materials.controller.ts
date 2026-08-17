import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseInterceptors,
  UploadedFiles, Header,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MaterialsService } from './materials.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  AddProjectMaterialDto,
  ApproveProjectMaterialDto,
} from './dto/material.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'List public materials (no auth required)' })
  findPublic() {
    return this.materialsService.findPublic();
  }

  @Get('store')
  @Public()
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'List materials for storefront (no auth required)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findStoreMaterials(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.materialsService.findPublicForStore(p, l);
  }

  @Get()
  @ApiBearerAuth()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all materials (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const pagination = { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 };
    return this.materialsService.findAll(pagination, { category, isActive, search });
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get material by ID' })
  findOne(@Param('id') id: string) {
    return this.materialsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'swatchImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]))
  @ApiOperation({ summary: 'Create a material' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string', enum: ['wood_species', 'wood_finish', 'aluminum_profile', 'aluminum_color', 'hardware', 'glass', 'other'] },
        description: { type: 'string' },
        unitCost: { type: 'number' },
        unit: { type: 'string' },
        supplier: { type: 'string' },
        swatchImage: { type: 'string', format: 'binary' },
        images: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 5 },
        isPublicVisible: { type: 'boolean' },
        isActive: { type: 'boolean' },
      },
    },
  })
  create(
    @Body() dto: CreateMaterialDto,
    @UploadedFiles() files?: { swatchImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    return this.materialsService.create(dto, files);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'swatchImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]))
  @ApiOperation({ summary: 'Update material' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        unitCost: { type: 'number' },
        unit: { type: 'string' },
        supplier: { type: 'string' },
        swatchImage: { type: 'string', format: 'binary' },
        images: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 5 },
        isPublicVisible: { type: 'boolean' },
        isActive: { type: 'boolean' },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @UploadedFiles() files?: { swatchImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    return this.materialsService.update(id, dto, files);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete material' })
  remove(@Param('id') id: string) {
    return this.materialsService.delete(id);
  }
}

@ApiTags('Project Materials')
@ApiBearerAuth()
@Controller('projects/:projectId/materials')
export class ProjectMaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List materials for a project' })
  getProjectMaterials(@Param('projectId') projectId: string, @Query() pagination: PaginationDto) {
    return this.materialsService.getProjectMaterials(projectId, pagination);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Add a material to a project' })
  add(
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMaterialDto,
  ) {
    return this.materialsService.addProjectMaterial(projectId, dto);
  }

  @Patch(':id/approve')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Approve/reject a project material' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveProjectMaterialDto,
  ) {
    return this.materialsService.approveProjectMaterial(id, dto.clientApproved);
  }

  @Delete(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Remove material from project' })
  remove(@Param('id') id: string) {
    return this.materialsService.removeProjectMaterial(id);
  }
}
