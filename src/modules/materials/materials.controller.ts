import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
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
  @ApiOperation({ summary: 'List public materials (no auth required)' })
  findPublic() {
    return this.materialsService.findPublic();
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all materials (admin)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.materialsService.findAll(pagination, { category, isActive });
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get material by ID' })
  findOne(@Param('id') id: string) {
    return this.materialsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create a material' })
  create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update material' })
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete material' })
  remove(@Param('id') id: string) {
    return this.materialsService.delete(id);
  }
}

@ApiTags('Project Materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/materials')
export class ProjectMaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'List materials for a project' })
  getProjectMaterials(@Param('projectId') projectId: string) {
    return this.materialsService.getProjectMaterials(projectId);
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
