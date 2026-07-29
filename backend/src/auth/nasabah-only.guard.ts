import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class NasabahOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    if (user?.accountType !== 'nasabah') {
      throw new ForbiddenException('Hanya nasabah yang dapat mengakses resource ini');
    }
    return true;
  }
}
