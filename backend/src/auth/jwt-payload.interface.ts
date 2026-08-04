export type AuthAccountType = 'staff' | 'nasabah';

export interface LinkedStaffInfo {
  id: string;
  role: string;
  nama: string;
}

export interface JwtPayload {
  id: string;
  username: string;
  nama: string;
  role: string;
  accountType: AuthAccountType;
  sid: string;
  // Present when this nasabah account is also linked to a staff account
  // (e.g. a guru who is also admin/teller/superadmin) sharing the same
  // No Rekening as their staff username - lets one NPY login grant both
  // the nasabah portal and the staff panel in a single session.
  linkedStaff?: LinkedStaffInfo;
}
