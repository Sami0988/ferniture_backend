import { Injectable, NotFoundException } from '@nestjs/common';
import { MaterialsRepository } from './materials.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly repo: MaterialsRepository,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll(pagination: PaginationDto, filters?: { category?: string; isActive?: string; search?: string }): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination, filters);
  }

  async findPublic(): Promise<any[]> {
    return this.repo.findPublic();
  }

  async findById(id: string) {
    const material = await this.repo.findById(id);
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async create(data: any, files?: { swatchImage?: Express.Multer.File[]; images?: Express.Multer.File[] }) {
    if (files?.swatchImage?.[0]) {
      const result = await this.uploadsService.uploadImage(files.swatchImage[0], 'kassahun/materials/swatch');
      data.swatchImageUrl = result.url;
    }
    if (files?.images?.length) {
      const uploadPromises = files.images.map(file => this.uploadsService.uploadImage(file, 'kassahun/materials/images'));
      const results = await Promise.all(uploadPromises);
      data.images = results.map(r => r.url);
    }
    return this.repo.create(data);
  }

  async update(id: string, data: any, files?: { swatchImage?: Express.Multer.File[]; images?: Express.Multer.File[] }) {
    await this.findById(id);
    if (files?.swatchImage?.[0]) {
      const result = await this.uploadsService.uploadImage(files.swatchImage[0], 'kassahun/materials/swatch');
      data.swatchImageUrl = result.url;
    }
    if (files?.images?.length) {
      const uploadPromises = files.images.map(file => this.uploadsService.uploadImage(file, 'kassahun/materials/images'));
      const results = await Promise.all(uploadPromises);
      data.images = results.map(r => r.url);
    }
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async addProjectMaterial(projectId: string, data: any) {
    await this.findById(data.materialId);
    return this.repo.addProjectMaterial(projectId, data);
  }

  async getProjectMaterials(projectId: string, pagination?: PaginationDto) {
    return this.repo.getProjectMaterials(projectId, pagination);
  }

  async approveProjectMaterial(id: string, approved: boolean) {
    return this.repo.updateProjectMaterial(id, {
      clientApproved: approved,
      approvedAt: approved ? new Date() : null,
    });
  }

  async removeProjectMaterial(id: string) {
    await this.repo.removeProjectMaterial(id);
  }
}
