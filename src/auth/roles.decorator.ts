import { SetMetadata } from '@nestjs/common';
import { Role } from '../generated/prisma/client';

export const ROLES_KEY = 'roles';

/** Batasi endpoint staff ke role tertentu, mis. `@Roles(Role.teller)`.
 * Hanya berarti untuk akun staff — role nasabah (siswa/guru/umum) tidak
 * pernah dicek lewat decorator ini. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
