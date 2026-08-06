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
  linkedStaff?: LinkedStaffInfo;
}
