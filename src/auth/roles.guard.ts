import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
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

    // `role` pada token nasabah sebenarnya berisi jenisNasabah (siswa/guru/umum),
    // bukan Role enum staff — RolesGuard hanya pernah dipasang di endpoint staff,
    // jadi accountType harus 'staff' supaya perbandingan role di bawah ini valid.
    if (user?.accountType !== 'staff' || !requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException(
        `Role ${user?.role ?? 'tidak dikenal'} tidak memiliki akses ke resource ini`,
      );
    }
    return true;
  }
}
