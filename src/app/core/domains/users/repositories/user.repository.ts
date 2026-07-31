import { PlatformUser } from '../models/platform-user.model';

export abstract class UserRepository {
  abstract create(user: PlatformUser): Promise<void>;

  abstract getById(userUid: string): Promise<PlatformUser | null>;

  abstract update(
    userUid: string,
    changes: Partial<PlatformUser>
  ): Promise<void>;
}