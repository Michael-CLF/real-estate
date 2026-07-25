import { PlatformUser } from '../models/platform-user.model';

export abstract class UserRepository {
  abstract create(user: PlatformUser): Promise<void>;

  abstract getById(userId: string): Promise<PlatformUser | null>;

  abstract update(
    userId: string,
    changes: Partial<PlatformUser>
  ): Promise<void>;
}