import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and } from 'drizzle-orm';
import { materials, projectMaterials } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class MaterialsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll(pagination: PaginationDto, filters?: { category?: string; isActive?: string }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.category) conditions.push(eq(materials.category, filters.category as any));
    if (filters?.isActive !== undefined) conditions.push(eq(materials.isActive, filters.isActive === 'true'));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(materials)
      .where(where as any);

    const data = await this.db
      .select()
      .from(materials)
      .where(where as any)
      .orderBy(desc(materials.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findPublic(): Promise<any[]> {
    return this.db
      .select()
      .from(materials)
      .where(and(eq(materials.isPublicVisible, true), eq(materials.isActive, true)))
      .orderBy(materials.name);
  }

  async findById(id: string) {
    const [material] = await this.db.select().from(materials).where(eq(materials.id, id));
    return material || null;
  }

  async create(data: any) {
    const [material] = await this.db.insert(materials).values(data).returning();
    return material;
  }

  async update(id: string, data: any) {
    const [updated] = await this.db
      .update(materials)
      .set(data)
      .where(eq(materials.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Material not found');
    return updated;
  }

  async delete(id: string) {
    await this.db.delete(materials).where(eq(materials.id, id));
  }

  async addProjectMaterial(projectId: string, data: any) {
    const [record] = await this.db
      .insert(projectMaterials)
      .values({ projectId, ...data })
      .returning();
    return record;
  }

  async getProjectMaterials(projectId: string) {
    return this.db
      .select({
        id: projectMaterials.id,
        quantity: projectMaterials.quantity,
        clientApproved: projectMaterials.clientApproved,
        approvedAt: projectMaterials.approvedAt,
        samplePhotoUrl: projectMaterials.samplePhotoUrl,
        notes: projectMaterials.notes,
        materialId: materials.id,
        materialName: materials.name,
        materialCategory: materials.category,
        unitCost: materials.unitCost,
        unit: materials.unit,
      })
      .from(projectMaterials)
      .innerJoin(materials, eq(projectMaterials.materialId, materials.id))
      .where(eq(projectMaterials.projectId, projectId));
  }

  async updateProjectMaterial(id: string, data: any) {
    const [updated] = await this.db
      .update(projectMaterials)
      .set(data)
      .where(eq(projectMaterials.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Project material not found');
    return updated;
  }

  async removeProjectMaterial(id: string) {
    await this.db.delete(projectMaterials).where(eq(projectMaterials.id, id));
  }
}
