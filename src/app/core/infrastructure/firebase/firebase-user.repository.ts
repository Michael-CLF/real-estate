import {
  Injectable
} from '@angular/core';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import {
  firestore
} from './firebase';

import {
  UserRepository
} from '../../domains/users/repositories/user.repository';

import {
  PlatformUser
} from '../../domains/users/models/platform-user.model';


@Injectable({
  providedIn: 'root'
})
export class FirebaseUserRepository
  extends UserRepository {

  private readonly collectionName =
    'users';


  async create(
    user: PlatformUser
  ): Promise<void> {
    const userReference = doc(
      firestore,
      this.collectionName,
      user.uid
    );

    await setDoc(
      userReference,
      user
    );
  }


  async getById(
    userId: string
  ): Promise<PlatformUser | null> {
    const userReference = doc(
      firestore,
      this.collectionName,
      userId
    );

    const snapshot = await getDoc(
      userReference
    );

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as PlatformUser;
  }


  async update(
    userUid: string,
    changes: Partial<PlatformUser>
  ): Promise<void> {
    const userReference = doc(
      firestore,
      this.collectionName,
      userUid
    );

    await updateDoc(
      userReference,
      changes
    );
  }
}