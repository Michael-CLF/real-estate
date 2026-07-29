export interface PlatformUser {
  id: string;

  firstName: string;
  lastName: string;
  displayName: string;

  email: string;
  phone: string | null;

  photoURL?: string | null;

  emailVerified: boolean;

  status: 'active' | 'disabled';

  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}