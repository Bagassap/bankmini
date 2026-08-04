import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class StaffOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    if (user?.accountType !== 'staff' && !user?.linkedStaff) {
      throw new ForbiddenException(
        'Hanya staf (admin/teller) yang dapat mengakses resource ini',
      );
    }
    return true;
  }
}
