import { Controller, Get, MessageEvent, Post, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.findForUser(user);
  }

  @Post('mark-read')
  async markRead(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.markAllRead(user);
    return { message: 'Notifikasi ditandai sudah dibaca' };
  }

  @Sse('stream')
  stream(@CurrentUser() user: JwtPayload): Observable<MessageEvent> {
    return this.notificationsService.stream(user);
  }
}
