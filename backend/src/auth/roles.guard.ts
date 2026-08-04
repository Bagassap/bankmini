import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../generated/prisma/client';
import { ROLES_KEY } from './roles.decorator';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    const effectiveRole =
      user?.accountType === 'staff' ? user.role : user?.linkedStaff?.role;

    if (!effectiveRole || !requiredRoles.includes(effectiveRole as Role)) {
      throw new ForbiddenException(
        `Role ${effectiveRole ?? 'tidak dikenal'} tidak memiliki akses ke resource ini`,
      );
    }
    return true;
  }
}
