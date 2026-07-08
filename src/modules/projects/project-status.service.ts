import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoicesService } from '../invoices/invoices.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const VALID_TRANSITIONS: Record<string, string[]> = {
  new: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['delivered', 'cancelled'],
  delivered: ['paid', 'cancelled'],
  paid: [],
  cancelled: ['new'],
};

@Injectable()
export class ProjectStatusService {
  private readonly logger = new Logger(ProjectStatusService.name);

  constructor(
    private readonly repo: ProjectsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly invoicesService: InvoicesService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  validateTransition(currentStatus: string, newStatus: string): void {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed?.join(', ') || 'none'}`,
      );
    }
  }

  async transitionStatus(
    projectId: string,
    newStatus: string,
    changedBy: string,
    notes?: string,
  ) {
    const project = await this.repo.findById(projectId);
    if (!project) {
      throw new BadRequestException('Project not found');
    }

    this.validateTransition(project.status, newStatus);

    const updatedProject = await this.repo.updateStatus(projectId, newStatus, changedBy, notes);

    // Get assignee user IDs for notifications
    const assignees = await this.repo.getAssignees(projectId);
    const assigneeUserIds = assignees.map((a) => a.id);

    // Get changedBy user name
    const changedByName = project.assignees?.find((a) => a.id === changedBy)?.fullName || 'System';

    // Fan out notifications
    try {
      await this.notificationsService.notifyProjectStatusChanged(
        projectId,
        project.title,
        newStatus,
        changedByName,
        assigneeUserIds,
      );
    } catch (error) {
      this.logger.error(`Failed to send status change notification: ${error.message}`);
    }

    // Queue email for completed status
    if (newStatus === 'completed' && project.customerPhone) {
      try {
        await this.emailQueue.add('job-completed', {
          to: project.customerEmail || '',
          projectTitle: project.title,
          projectNumber: project.projectNumber,
        });
      } catch (error) {
        this.logger.error(`Failed to queue job-completed email: ${error.message}`);
      }
    }

    // Auto-create invoice when status becomes 'paid'
    if (newStatus === 'paid') {
      try {
        const existingInvoice = await this.invoicesService.findByProjectId(projectId);
        if (!existingInvoice) {
          await this.invoicesService.createFromProject(projectId, changedBy);
          this.logger.log(`Invoice auto-created for project ${project.projectNumber}`);
        }
      } catch (error) {
        this.logger.error(`Failed to auto-create invoice: ${error.message}`);
      }
    }

    return updatedProject;
  }
}
