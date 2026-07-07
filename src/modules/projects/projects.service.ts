import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly repo: ProjectsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(pagination: PaginationDto, filters?: { status?: string; division?: string; priority?: string; search?: string }): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination, filters);
  }

  async findById(id: string) {
    const project = await this.repo.findById(id);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(data: any, assigneeIds: string[], createdBy: string) {
    const projectNumber = data.projectNumber || await this.repo.generateProjectNumber();
    const project = await this.repo.create({ ...data, projectNumber, createdBy }, assigneeIds);

    // Notify assigned employees
    if (assigneeIds.length > 0) {
      try {
        for (const userId of assigneeIds) {
          await this.notificationsService.notifyJobAssigned(
            userId,
            project.id,
            project.title,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to send job assignment notifications: ${error.message}`);
      }
    }

    return project;
  }

  async update(id: string, data: any, assigneeIds?: string[]) {
    await this.findById(id);
    return this.repo.update(id, data, assigneeIds);
  }

  async updateStatus(id: string, newStatus: string, changedBy: string, notes?: string) {
    await this.findById(id);
    return this.repo.updateStatus(id, newStatus, changedBy, notes);
  }

  async getAssignees(id: string) {
    await this.findById(id);
    return this.repo.getAssignees(id);
  }

  async addAssignee(projectId: string, employeeId: string) {
    await this.findById(projectId);
    return this.repo.addAssignee(projectId, employeeId);
  }

  async removeAssignee(projectId: string, employeeId: string) {
    await this.findById(projectId);
    return this.repo.removeAssignee(projectId, employeeId);
  }

  async getStatusHistory(id: string) {
    await this.findById(id);
    return this.repo.getStatusHistory(id);
  }

  async getAttachments(id: string) {
    await this.findById(id);
    return this.repo.getAttachments(id);
  }

  async addAttachment(projectId: string, data: any, uploadedBy: string) {
    await this.findById(projectId);
    return this.repo.addAttachment(projectId, { ...data, uploadedBy });
  }

  async deleteAttachment(attachmentId: string) {
    return this.repo.deleteAttachment(attachmentId);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }
}
