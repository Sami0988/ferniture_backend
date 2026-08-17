import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { notifications, fcmTokens, users } from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async create(data: {
    userId: string;
    title: string;
    body: string;
    type: string;
    relatedProjectId?: string;
  }) {
    const [notification] = await this.db
      .insert(notifications)
      .values(data)
      .returning();
    return notification;
  }

  async findByUser(userId: string, pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const data = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.count;
  }

  async markAsRead(id: string, userId: string) {
    const [updated] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    if (!updated) throw new NotFoundException('Notification not found');
    return updated;
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async saveFcmToken(userId: string, token: string, platform: string) {
    const [existing] = await this.db
      .select()
      .from(fcmTokens)
      .where(eq(fcmTokens.token, token));

    if (existing) {
      await this.db
        .update(fcmTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(fcmTokens.id, existing.id));
      return existing;
    }

    const [record] = await this.db
      .insert(fcmTokens)
      .values({ userId, token, platform: platform as any })
      .returning();
    return record;
  }

  async removeFcmToken(userId: string, token: string) {
    await this.db.delete(fcmTokens).where(
      and(eq(fcmTokens.token, token), eq(fcmTokens.userId, userId)),
    );
  }

  async getFcmTokensByUser(userId: string) {
    return this.db
      .select()
      .from(fcmTokens)
      .where(eq(fcmTokens.userId, userId));
  }

  async getAllAdminTokens(): Promise<{ token: string; platform: string }[]> {
    const result = await this.db
      .select({ token: fcmTokens.token, platform: fcmTokens.platform })
      .from(fcmTokens)
      .innerJoin(users, eq(fcmTokens.userId, users.id))
      .where(inArray(users.role, ['super_admin', 'manager']));
    return result;
  }
}
