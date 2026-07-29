export type AuthAccountType = 'staff' | 'nasabah';

export interface JwtPayload {
  id: string;
  username: string;
  nama: string;
  role: string;
  accountType: AuthAccountType;
  sid: string;
}
