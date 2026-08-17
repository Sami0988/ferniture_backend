import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and, ilike } from 'drizzle-orm';
import { galleryImages, projects } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class GalleryProjectRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll(
    pagination: PaginationDto,
    filters?: { division?: string; projectId?: string; search?: string },
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.division) conditions.push(eq(galleryImages.division, filters.division as any));
    if (filters?.projectId) conditions.push(eq(galleryImages.projectId, filters.projectId));
    if (filters?.search) conditions.push(ilike(galleryImages.title, `%${filters.search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(galleryImages)
      .where(where as any);

    const data = await this.db
      .select({
        id: galleryImages.id,
        title: galleryImages.title,
        division: galleryImages.division,
        projectId: galleryImages.projectId,
        imageUrl: galleryImages.imageUrl,
        roomType: galleryImages.roomType,
        aspect: galleryImages.aspect,
        isFeatured: galleryImages.isFeatured,
        createdAt: galleryImages.createdAt,
        projectTitle: projects.title,
      })
      .from(galleryImages)
      .leftJoin(projects, eq(galleryImages.projectId, projects.id))
      .where(where as any)
      .orderBy(desc(galleryImages.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findById(id: string) {
    const [item] = await this.db
      .select({
        id: galleryImages.id,
        title: galleryImages.title,
        division: galleryImages.division,
        projectId: galleryImages.projectId,
        imageUrl: galleryImages.imageUrl,
        roomType: galleryImages.roomType,
        aspect: galleryImages.aspect,
        isFeatured: galleryImages.isFeatured,
        createdAt: galleryImages.createdAt,
        projectTitle: projects.title,
      })
      .from(galleryImages)
      .leftJoin(projects, eq(galleryImages.projectId, projects.id))
      .where(eq(galleryImages.id, id));
    return item || null;
  }

  async findByProjectId(projectId: string): Promise<any[]> {
    return this.db
      .select({
        id: galleryImages.id,
        title: galleryImages.title,
        division: galleryImages.division,
        projectId: galleryImages.projectId,
        imageUrl: galleryImages.imageUrl,
        roomType: galleryImages.roomType,
        aspect: galleryImages.aspect,
        isFeatured: galleryImages.isFeatured,
        createdAt: galleryImages.createdAt,
      })
      .from(galleryImages)
      .where(eq(galleryImages.projectId, projectId))
      .orderBy(desc(galleryImages.createdAt));
  }

  async create(data: any) {
    const [item] = await this.db.insert(galleryImages).values(data).returning();
    return item;
  }

  async update(id: string, data: any) {
    const [updated] = await this.db
      .update(galleryImages)
      .set(data)
      .where(eq(galleryImages.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Gallery project image not found');
    return updated;
  }

  async toggleFeatured(id: string) {
    const [existing] = await this.db.select().from(galleryImages).where(eq(galleryImages.id, id));
    if (!existing) throw new NotFoundException('Gallery project image not found');

    const [updated] = await this.db
      .update(galleryImages)
      .set({ isFeatured: !existing.isFeatured })
      .where(eq(galleryImages.id, id))
      .returning();
    return updated;
  }

  async delete(id: string) {
    await this.db.delete(galleryImages).where(eq(galleryImages.id, id));
  }
}
