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

  async findPublicForStore(page?: number, limit?: number) {
    const materialTypeMap: Record<string, string> = {
      wood_species: 'Wood',
      wood_finish: 'Wood',
      aluminum_profile: 'Aluminum',
      aluminum_color: 'Aluminum',
      hardware: 'Hardware',
      glass: 'Glass',
      other: 'Other',
    };

    if (page || limit) {
      const p = page || 1;
      const l = limit || 20;
      const result = await this.repo.findPublicPaginated(p, l);

      const materials = result.data.map((m) => ({
        id: m.id,
        name: m.name,
        type: materialTypeMap[m.category] || m.category,
        image: m.swatchImageUrl,
      }));

      return {
        materials,
        total: result.total,
        page: p,
        limit: l,
        totalPages: Math.ceil(result.total / l),
      };
    }

    const rawMaterials = await this.repo.findPublic();

    const materials = rawMaterials.map((m) => ({
      id: m.id,
      name: m.name,
      type: materialTypeMap[m.category] || m.category,
      image: m.swatchImageUrl,
    }));

    return { materials };
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
