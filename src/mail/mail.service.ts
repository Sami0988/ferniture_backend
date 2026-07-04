import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private templatesDir: string;

  constructor(private readonly configService: ConfigService) {
    this.templatesDir = path.join(__dirname, 'templates');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('app.smtp.host'),
      port: this.configService.get<number>('app.smtp.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('app.smtp.user'),
        pass: this.configService.get<string>('app.smtp.pass'),
      },
    });
  }

  private compileTemplate(templateName: string, context: Record<string, any>): string {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    const source = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(source);
    return template(context);
  }

  async send(to: string, subject: string, templateName: string, context: Record<string, any>) {
    try {
      const html = this.compileTemplate(templateName, context);

      await this.transporter.sendMail({
        from: this.configService.get<string>('app.mailFrom'),
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  async sendOtp(to: string, otp: string, userName: string) {
    await this.send(to, 'Your Verification Code', 'otp', {
      userName,
      otp,
      expiresIn: '10 minutes',
    });
  }

  async sendJobCompleted(to: string, projectTitle: string, projectNumber: string) {
    await this.send(to, `Project Completed: ${projectTitle}`, 'job-completed', {
      projectTitle,
      projectNumber,
      completedAt: new Date().toLocaleDateString(),
    });
  }

  async sendDailyDigest(to: string, data: {
    userName: string;
    overdueProjects: { title: string; projectNumber: string; deliveryDate: string }[];
    recentPayments: { invoiceNumber: string; amount: string; customerName: string }[];
    newProjects: { title: string; projectNumber: string }[];
  }) {
    await this.send(to, 'Daily Summary - Kassahun Wood & Aluminum', 'daily-digest', data);
  }
}
