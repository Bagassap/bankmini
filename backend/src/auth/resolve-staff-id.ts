import type { JwtPayload } from './jwt-payload.interface';

// Behind StaffOnlyGuard, `accountType === 'staff'` means user.id already IS
// the staff id; otherwise the request only got this far because of a
// dual-role nasabah login carrying linkedStaff, so that id is the real one.
export function resolveStaffId(user: JwtPayload): string {
  return user.accountType === 'staff' ? user.id : user.linkedStaff!.id;
}
