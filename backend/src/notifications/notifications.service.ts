import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Notification, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';

export interface CreateNotificationInput {
  recipientType: 'staff_broadcast' | 'nasabah';
  nasabahId?: string;
  type: string;
  title: string;
  description: string;
  link?: string;
}

const LIST_LIMIT = 30;

@Injectable()
export class NotificationsService {
  private readonly events$ = new Subject<Notification>();

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        recipientType: input.recipientType,
        nasabahId: input.nasabahId,
        type: input.type,
        title: input.title,
        description: input.description,
        link: input.link,
      },
    });
    this.events$.next(notification);
    return notification;
  }

  async findForUser(payload: JwtPayload) {
    const [items, lastReadAt] = await Promise.all([
      this.prisma.notification.findMany({
        where: this.scopeFor(payload),
        orderBy: { createdAt: 'desc' },
        take: LIST_LIMIT,
      }),
      this.lastReadAtFor(payload),
    ]);
    const unreadCount = lastReadAt
      ? items.filter((n) => n.createdAt > lastReadAt).length
      : items.length;
    return { items, unreadCount };
  }

  async markAllRead(payload: JwtPayload): Promise<void> {
    if (payload.accountType === 'staff') {
      await this.prisma.user.update({
        where: { id: payload.id },
        data: { lastNotificationReadAt: new Date() },
      });
      return;
    }
    await this.prisma.nasabah.update({
      where: { id: payload.id },
      data: { lastNotificationReadAt: new Date() },
    });
  }

  stream(payload: JwtPayload): Observable<MessageEvent> {
    return this.events$.asObservable().pipe(
      filter((n) => this.matches(n, payload)),
      map((n) => ({ data: n }) as MessageEvent),
    );
  }

  private scopeFor(payload: JwtPayload): Prisma.NotificationWhereInput {
    if (payload.accountType === 'staff') {
      return { recipientType: 'staff_broadcast' };
    }
    if (payload.linkedStaff) {
      return {
        OR: [
          { recipientType: 'staff_broadcast' },
          { recipientType: 'nasabah', nasabahId: payload.id },
        ],
      };
    }
    return { recipientType: 'nasabah', nasabahId: payload.id };
  }

  private matches(n: Notification, payload: JwtPayload): boolean {
    if (payload.accountType === 'staff') {
      return n.recipientType === 'staff_broadcast';
    }
    if (payload.linkedStaff) {
      return n.recipientType === 'staff_broadcast' || n.nasabahId === payload.id;
    }
    return n.recipientType === 'nasabah' && n.nasabahId === payload.id;
  }

  private async lastReadAtFor(payload: JwtPayload): Promise<Date | null> {
    if (payload.accountType === 'staff') {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
        select: { lastNotificationReadAt: true },
      });
      return user?.lastNotificationReadAt ?? null;
    }
    const nasabah = await this.prisma.nasabah.findUnique({
      where: { id: payload.id },
      select: { lastNotificationReadAt: true },
    });
    return nasabah?.lastNotificationReadAt ?? null;
  }
}
