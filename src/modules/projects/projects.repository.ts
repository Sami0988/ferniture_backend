import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and } from 'drizzle-orm';
import { projects, projectAssignees, projectStatusHistory, projectAttachments, customers, users } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async generateProjectNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(sql`EXTRACT(YEAR FROM ${projects.createdAt}) = ${year}`);

    const seq = String((result.count || 0) + 1).padStart(4, '0');
    return `PRJ-${year}-${seq}`;
  }

  async findAll(pagination: PaginationDto, filters?: { status?: string; division?: string; priority?: string; search?: string }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.status) conditions.push(eq(projects.status, filters.status as any));
    if (filters?.division) conditions.push(eq(projects.division, filters.division as any));
    if (filters?.priority) conditions.push(eq(projects.priority, filters.priority as any));
    if (filters?.search) {
      conditions.push(sql`(${projects.title} ILIKE ${'%' + filters.search + '%'} OR ${projects.projectNumber} ILIKE ${'%' + filters.search + '%'} OR ${customers.fullName} ILIKE ${'%' + filters.search + '%'})`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(where as any);

    const data = await this.db
      .select({
        id: projects.id,
        projectNumber: projects.projectNumber,
        title: projects.title,
        description: projects.description,
        division: projects.division,
        status: projects.status,
        priority: projects.priority,
        orderDate: projects.orderDate,
        deliveryDate: projects.deliveryDate,
        completedAt: projects.completedAt,
        deliveredAt: projects.deliveredAt,
        customerName: customers.fullName,
        leadEmployeeId: projects.leadEmployeeId,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .leftJoin(customers, eq(projects.customerId, customers.id))
      .where(where)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findById(id: string) {
    const [project] = await this.db
      .select({
        id: projects.id,
        projectNumber: projects.projectNumber,
        title: projects.title,
        description: projects.description,
        division: projects.division,
        status: projects.status,
        priority: projects.priority,
        orderDate: projects.orderDate,
        deliveryDate: projects.deliveryDate,
        completedAt: projects.completedAt,
        deliveredAt: projects.deliveredAt,
        customerId: projects.customerId,
        customerName: customers.fullName,
        customerPhone: customers.phone,
        leadEmployeeId: projects.leadEmployeeId,
        createdBy: projects.createdBy,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .leftJoin(customers, eq(projects.customerId, customers.id))
      .where(eq(projects.id, id));

    if (!project) return null;

    const assignees = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        phone: users.phone,
        specialty: users.role,
      })
      .from(projectAssignees)
      .innerJoin(users, eq(projectAssignees.employeeId, users.id))
      .where(eq(projectAssignees.projectId, id));

    return { ...project, assignees };
  }

  async create(data: any, assigneeIds: string[]) {
    return this.db.transaction(async (tx: any) => {
      const [project] = await tx
        .insert(projects)
        .values(data)
        .returning();

      if (assigneeIds.length > 0) {
        await tx.insert(projectAssignees).values(
          assigneeIds.map((employeeId) => ({
            projectId: project.id,
            employeeId,
          })),
        );
      }

      return this.findById(project.id);
    });
  }

  async update(id: string, data: any, assigneeIds?: string[]) {
    return this.db.transaction(async (tx: any) => {
      await tx.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id));

      if (assigneeIds) {
        await tx.delete(projectAssignees).where(eq(projectAssignees.projectId, id));
        if (assigneeIds.length > 0) {
          await tx.insert(projectAssignees).values(
            assigneeIds.map((employeeId) => ({ projectId: id, employeeId })),
          );
        }
      }

      return this.findById(id);
    });
  }

  async updateStatus(id: string, newStatus: string, changedBy: string, notes?: string) {
    return this.db.transaction(async (tx: any) => {
      const [current] = await tx.select().from(projects).where(eq(projects.id, id));
      if (!current) throw new NotFoundException('Project not found');

      const updateData: any = { status: newStatus, updatedAt: new Date() };
      if (newStatus === 'completed') updateData.completedAt = new Date();
      if (newStatus === 'delivered') updateData.deliveredAt = new Date();

      await tx.update(projects).set(updateData).where(eq(projects.id, id));

      await tx.insert(projectStatusHistory).values({
        projectId: id,
        oldStatus: current.status,
        newStatus: newStatus as any,
        changedBy,
        notes,
      });

      return this.findById(id);
    });
  }

  async getAssignees(projectId: string) {
    return this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        phone: users.phone,
      })
      .from(projectAssignees)
      .innerJoin(users, eq(projectAssignees.employeeId, users.id))
      .where(eq(projectAssignees.projectId, projectId));
  }

  async getStatusHistory(projectId: string) {
    return this.db
      .select()
      .from(projectStatusHistory)
      .where(eq(projectStatusHistory.projectId, projectId))
      .orderBy(desc(projectStatusHistory.changedAt));
  }

  async getAttachments(projectId: string) {
    return this.db
      .select({
        id: projectAttachments.id,
        fileUrl: projectAttachments.fileUrl,
        fileType: projectAttachments.fileType,
        caption: projectAttachments.caption,
        latitude: projectAttachments.latitude,
        longitude: projectAttachments.longitude,
        uploadedBy: projectAttachments.uploadedBy,
        uploaderName: users.fullName,
        createdAt: projectAttachments.createdAt,
      })
      .from(projectAttachments)
      .leftJoin(users, eq(projectAttachments.uploadedBy, users.id))
      .where(eq(projectAttachments.projectId, projectId))
      .orderBy(desc(projectAttachments.createdAt));
  }

  async addAttachment(projectId: string, data: {
    fileUrl: string;
    fileType: string;
    caption?: string;
    latitude?: number;
    longitude?: number;
    uploadedBy?: string;
  }) {
    const [attachment] = await this.db
      .insert(projectAttachments)
      .values({ projectId, ...data })
      .returning();

    return attachment;
  }

  async deleteAttachment(id: string) {
    const [attachment] = await this.db
      .select()
      .from(projectAttachments)
      .where(eq(projectAttachments.id, id));

    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.db.delete(projectAttachments).where(eq(projectAttachments.id, id));
    return attachment;
  }

  async delete(id: string) {
    await this.db.delete(projectAttachments).where(eq(projectAttachments.projectId, id));
    await this.db.delete(projectAssignees).where(eq(projectAssignees.projectId, id));
    await this.db.delete(projectStatusHistory).where(eq(projectStatusHistory.projectId, id));
    await this.db.delete(projects).where(eq(projects.id, id));
  }
}
