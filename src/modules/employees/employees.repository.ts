import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and } from 'drizzle-orm';
import { users, employeeProfiles, projectAssignees, projects } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .innerJoin(employeeProfiles, eq(users.id, employeeProfiles.userId));

    const data = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        specialty: employeeProfiles.specialty,
        hireDate: employeeProfiles.hireDate,
        idNumber: employeeProfiles.idNumber,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findById(id: string) {
    const [result] = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        specialty: employeeProfiles.specialty,
        hireDate: employeeProfiles.hireDate,
        idNumber: employeeProfiles.idNumber,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
      .where(eq(users.id, id));

    return result || null;
  }

  async create(data: {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
    specialty: string;
    hireDate?: string;
    idNumber?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    return this.db.transaction(async (tx: any) => {
      const [user] = await tx
        .insert(users)
        .values({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          passwordHash,
          role: 'employee',
        })
        .returning();

      const [profile] = await tx
        .insert(employeeProfiles)
        .values({
          userId: user.id,
          specialty: data.specialty as any,
          hireDate: data.hireDate,
          idNumber: data.idNumber,
        })
        .returning();

      const { passwordHash: _, ...userWithoutPassword } = user;
      return { ...userWithoutPassword, ...profile };
    });
  }

  async update(id: string, userData: any, profileData: any) {
    return this.db.transaction(async (tx: any) => {
      if (userData) {
        await tx.update(users).set({ ...userData, updatedAt: new Date() }).where(eq(users.id, id));
      }
      if (profileData) {
        await tx.update(employeeProfiles).set(profileData).where(eq(employeeProfiles.userId, id));
      }
      return this.findById(id);
    });
  }

  async delete(id: string) {
    await this.db.delete(employeeProfiles).where(eq(employeeProfiles.userId, id));
    await this.db.delete(users).where(eq(users.id, id));
  }

  async setActive(id: string, isActive: boolean) {
    const [updated] = await this.db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Employee not found');
    return this.findById(id);
  }

  async getProjectHistory(employeeId: string) {
    return this.db
      .select({
        id: projects.id,
        projectNumber: projects.projectNumber,
        title: projects.title,
        status: projects.status,
        division: projects.division,
        orderDate: projects.orderDate,
        deliveryDate: projects.deliveryDate,
        completedAt: projects.completedAt,
        assignedAt: projectAssignees.assignedAt,
      })
      .from(projectAssignees)
      .innerJoin(projects, eq(projectAssignees.projectId, projects.id))
      .where(eq(projectAssignees.employeeId, employeeId))
      .orderBy(desc(projectAssignees.assignedAt));
  }

  async getWorkload(employeeId: string) {
    const [activeCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectAssignees)
      .innerJoin(projects, eq(projectAssignees.projectId, projects.id))
      .where(and(
        eq(projectAssignees.employeeId, employeeId),
        eq(projects.status, 'in_progress'),
      ));

    const [completedCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectAssignees)
      .innerJoin(projects, eq(projectAssignees.projectId, projects.id))
      .where(and(
        eq(projectAssignees.employeeId, employeeId),
        eq(projects.status, 'completed'),
      ));

    const [totalProjects] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectAssignees)
      .where(eq(projectAssignees.employeeId, employeeId));

    return {
      activeProjects: activeCount.count,
      completedProjects: completedCount.count,
      totalProjects: totalProjects.count,
    };
  }
}
