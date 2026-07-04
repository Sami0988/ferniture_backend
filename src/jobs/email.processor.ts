import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing email job: ${job.name}`);

    switch (job.name) {
      case 'send-otp':
        return this.handleOtp(job.data);
      case 'job-completed':
        return this.handleJobCompleted(job.data);
      case 'daily-digest':
        return this.handleDailyDigest(job.data);
      default:
        this.logger.warn(`Unknown email job type: ${job.name}`);
    }
  }

  private async handleOtp(data: { to: string; otp: string; userName: string }) {
    await this.mailService.sendOtp(data.to, data.otp, data.userName);
  }

  private async handleJobCompleted(data: {
    to: string;
    projectTitle: string;
    projectNumber: string;
  }) {
    await this.mailService.sendJobCompleted(data.to, data.projectTitle, data.projectNumber);
  }

  private async handleDailyDigest(data: {
    to: string;
    userName: string;
    overdueProjects: any[];
    recentPayments: any[];
    newProjects: any[];
  }) {
    await this.mailService.sendDailyDigest(data.to, {
      userName: data.userName,
      overdueProjects: data.overdueProjects,
      recentPayments: data.recentPayments,
      newProjects: data.newProjects,
    });
  }
}
