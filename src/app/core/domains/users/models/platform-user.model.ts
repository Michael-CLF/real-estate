import { UserRole } from './user-role.type';
import { UserStatus } from './user-status.type';

export type IdentityVerificationStatus =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'failed';

export interface PlatformUser {
  id: string;

  email: string;
  phone: string | null;

  firstName: string;
  lastName: string;
  displayName: string;

  roles: UserRole[];
  status: UserStatus;

  emailVerified: boolean;
  phoneVerified: boolean;
  identityStatus: IdentityVerificationStatus;

  createdAt: unknown;
  updatedAt: unknown;
  lastLoginAt: unknown | null;
}