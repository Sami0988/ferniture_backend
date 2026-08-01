import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { GalleryProjectRepository } from './gallery-project.repository';
import { UploadsService } from '../uploads/uploads.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class GalleryProjectService {
  constructor(
    private readonly repo: GalleryProjectRepository,
    private readonly uploadsService: UploadsService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: { division?: string; projectId?: string; search?: string },
  ): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination, filters);
  }

  async findById(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException('Gallery project image not found');
    return item;
  }

  async findByProjectId(projectId: string) {
    return this.repo.findByProjectId(projectId);
  }

  async create(data: any, files?: { image?: Express.Multer.File[] }) {
    if (files?.image?.[0]) {
      const result = await this.uploadsService.uploadImage(files.image[0], 'kassahun/gallery-project');
      data.imageUrl = result.url;
    }

    if (!data.imageUrl) {
      throw new BadRequestException('Either imageUrl or image file is required');
    }

    await this.invalidateCache();
    return this.repo.create(data);
  }

  async update(id: string, data: any, files?: { image?: Express.Multer.File[] }) {
    await this.findById(id);
    if (files?.image?.[0]) {
      const result = await this.uploadsService.uploadImage(files.image[0], 'kassahun/gallery-project');
      data.imageUrl = result.url;
    }
    await this.invalidateCache();
    return this.repo.update(id, data);
  }

  async toggleFeatured(id: string) {
    await this.findById(id);
    await this.invalidateCache();
    return this.repo.toggleFeatured(id);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.invalidateCache();
    await this.repo.delete(id);
  }

  private async invalidateCache() {
    await this.cache.del('gallery-project:all');
  }
}
