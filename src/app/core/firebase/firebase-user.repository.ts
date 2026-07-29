import { Injectable } from '@angular/core';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import { db } from './firebase';
import { UserRepository } from '../domains/users/repositories/user.repository';
import { PlatformUser } from '../domains/users/models/platform-user.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUserRepository extends UserRepository {

  private readonly collectionName = 'users';

  async create(user: PlatformUser): Promise<void> {
    const document = doc(
      db,
      this.collectionName,
      user.id
    );

    await setDoc(document, user);
  }

  async getById(userId: string): Promise<PlatformUser | null> {
    const document = doc(
      db,
      this.collectionName,
      userId
    );

    const snapshot = await getDoc(document);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as PlatformUser;
  }

  async update(
    userId: string,
    changes: Partial<PlatformUser>
  ): Promise<void> {
    const document = doc(
      db,
      this.collectionName,
      userId
    );

    await updateDoc(document, changes);
  }
}