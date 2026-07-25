import { UserRole } from './user-role.type';

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: UserRole[];
}