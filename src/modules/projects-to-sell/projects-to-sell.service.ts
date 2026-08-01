import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ProjectsToSellRepository } from './projects-to-sell.repository';
import { UploadsService } from '../uploads/uploads.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectsToSellService {
  constructor(
    private readonly repo: ProjectsToSellRepository,
    private readonly uploadsService: UploadsService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(pagination: PaginationDto, filters?: { division?: string; type?: string; search?: string }): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination, filters);
  }

  async findById(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async create(data: any, files?: { image?: Express.Multer.File[] }) {
    if (files?.image?.[0]) {
      const result = await this.uploadsService.uploadImage(files.image[0], 'kassahun/projects-to-sell');
      data.image = result.url;
    }
    await this.cache.del('pts:store');
    return this.repo.create(data);
  }

  async update(id: string, data: any, files?: { image?: Express.Multer.File[] }) {
    await this.findById(id);
    if (files?.image?.[0]) {
      const result = await this.uploadsService.uploadImage(files.image[0], 'kassahun/projects-to-sell');
      data.image = result.url;
    }
    await this.cache.del('pts:store');
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.cache.del('pts:store');
    await this.repo.delete(id);
  }

  // Public
  async getPublic(division?: string) {
    const cacheKey = `pts:store:${division || 'all'}`;
    let items = await this.cache.get<any[]>(cacheKey);
    if (!items) {
      items = await this.repo.findPublic(division);
      await this.cache.set(cacheKey, items, 300);
    }

    const divisionMap: Record<string, string> = {
      furniture: 'Furniture',
      aluminum: 'Aluminum',
      interior_design: 'Interior',
      custom_orders: 'Custom Orders',
      accessories: 'Accessories',
    };

    return {
      projects: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        division: divisionMap[item.division] || item.division,
        price: item.price ? Number(item.price) : null,
        image: item.image,
      })),
    };
  }

  async getPublicPaginated(page?: number, limit?: number, division?: string) {
    const p = page || 1;
    const l = limit || 20;
    const cacheKey = `pts:store:${p}:${l}:${division || 'all'}`;
    let cached = await this.cache.get<{ data: any[]; total: number }>(cacheKey);
    if (!cached) {
      cached = await this.repo.findPublicPaginated(p, l, division);
      await this.cache.set(cacheKey, cached, 300);
    }

    const divisionMap: Record<string, string> = {
      furniture: 'Furniture',
      aluminum: 'Aluminum',
      interior_design: 'Interior',
      custom_orders: 'Custom Orders',
      accessories: 'Accessories',
    };

    return {
      projects: cached.data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        division: divisionMap[item.division] || item.division,
        price: item.price ? Number(item.price) : null,
        image: item.image,
      })),
      total: cached.total,
      page: p,
      limit: l,
      totalPages: Math.ceil(cached.total / l),
    };
  }
}
