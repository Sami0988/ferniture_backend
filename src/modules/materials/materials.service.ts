import { Injectable, NotFoundException } from '@nestjs/common';
import { MaterialsRepository } from './materials.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly repo: MaterialsRepository) {}

  async findAll(pagination: PaginationDto, filters?: { category?: string; isActive?: string }): Promise<PaginatedResult<any>> {
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

  async create(data: any) {
    return this.repo.create(data);
  }

  async update(id: string, data: any) {
    await this.findById(id);
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

  async getProjectMaterials(projectId: string) {
    return this.repo.getProjectMaterials(projectId);
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
