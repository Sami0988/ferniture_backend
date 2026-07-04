import { Injectable, Logger } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { FcmService } from './fcm.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repo: NotificationsRepository,
    private readonly gateway: NotificationsGateway,
    private readonly fcmService: FcmService,
  ) {}

  async create(data: {
    userId: string;
    title: string;
    body: string;
    type: string;
    relatedProjectId?: string;
  }) {
    const notification = await this.repo.create(data);

    // Push to WebSocket
    this.gateway.emitToUser(data.userId, 'notification.new', notification);

    // Push via FCM
    const tokens = await this.repo.getFcmTokensByUser(data.userId);
    if (tokens.length > 0) {
      const fcmTokens = tokens.map((t) => t.token);
      await this.fcmService.sendToMultipleTokens(fcmTokens, {
        title: data.title,
        body: data.body,
      }, {
        type: data.type,
        projectId: data.relatedProjectId || '',
      });
    }

    return notification;
  }

  async createForAdmins(data: {
    title: string;
    body: string;
    type: string;
    relatedProjectId?: string;
  }) {
    // Broadcast to all connected admins via WebSocket
    this.gateway.emitToAdmins('notification.new', {
      title: data.title,
      body: data.body,
      type: data.type,
      relatedProjectId: data.relatedProjectId,
    });

    // Send FCM to admin tokens
    const tokens = await this.repo.getAllAdminTokens();
    if (tokens.length > 0) {
      await this.fcmService.sendToMultipleTokens(
        tokens.map((t) => t.token),
        { title: data.title, body: data.body },
        { type: data.type, projectId: data.relatedProjectId || '' },
      );
    }
  }

  async findByUser(userId: string, pagination: PaginationDto) {
    return this.repo.findByUser(userId, pagination);
  }

  async getUnreadCount(userId: string) {
    return this.repo.getUnreadCount(userId);
  }

  async markAsRead(id: string) {
    return this.repo.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    await this.repo.markAllAsRead(userId);
  }

  async saveFcmToken(userId: string, token: string, platform: string) {
    return this.repo.saveFcmToken(userId, token, platform);
  }

  async removeFcmToken(token: string) {
    await this.repo.removeFcmToken(token);
  }

  // Convenience methods for common notification types
  async notifyProjectStatusChanged(
    projectId: string,
    projectTitle: string,
    newStatus: string,
    changedByName: string,
    assignedUserIds: string[],
  ) {
    const title = 'Project Status Updated';
    const body = `${projectTitle} → ${newStatus.replace('_', ' ')} (by ${changedByName})`;

    for (const userId of assignedUserIds) {
      await this.create({
        userId,
        title,
        body,
        type: 'status_changed',
        relatedProjectId: projectId,
      });
    }

    await this.createForAdmins({ title, body, type: 'status_changed', relatedProjectId: projectId });
  }

  async notifyJobAssigned(
    userId: string,
    projectId: string,
    projectTitle: string,
  ) {
    await this.create({
      userId,
      title: 'New Job Assigned',
      body: `You have been assigned to: ${projectTitle}`,
      type: 'job_assigned',
      relatedProjectId: projectId,
    });
  }

  async notifyJobCompleted(
    projectId: string,
    projectTitle: string,
    employeeName: string,
  ) {
    await this.createForAdmins({
      title: 'Job Completed',
      body: `${employeeName} marked "${projectTitle}" as completed`,
      type: 'job_completed',
      relatedProjectId: projectId,
    });
  }

  async notifyOverdueProject(
    userId: string,
    projectId: string,
    projectTitle: string,
    deliveryDate: string,
  ) {
    await this.create({
      userId,
      title: 'Project Overdue',
      body: `"${projectTitle}" was due on ${deliveryDate}`,
      type: 'overdue',
      relatedProjectId: projectId,
    });
  }

  async notifyPaymentVerified(
    userId: string,
    invoiceNumber: string,
    amount: string,
  ) {
    await this.create({
      userId,
      title: 'Payment Verified',
      body: `Payment of ${amount} for ${invoiceNumber} has been verified`,
      type: 'payment_verified',
    });
  }

  async notifyPaymentReceived(
    invoiceNumber: string,
    amount: string,
  ) {
    await this.createForAdmins({
      title: 'Payment Received',
      body: `Payment of ${amount} received for invoice ${invoiceNumber}`,
      type: 'payment_verified',
    });
  }
}
