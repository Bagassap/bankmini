import type { JwtPayload } from './jwt-payload.interface';

export function resolveStaffId(user: JwtPayload): string {
  return user.accountType === 'staff' ? user.id : user.linkedStaff!.id;
}
