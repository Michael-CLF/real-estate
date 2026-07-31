import { Injectable } from '@angular/core';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import { firestore } from './firebase';
import { UserRepository } from '../../domains/users/repositories/user.repository';
import { PlatformUser } from '../../domains/users/models/platform-user.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUserRepository extends UserRepository {

  private readonly collectionName = 'users';

  async create(user: PlatformUser): Promise<void> {
    const document = doc(
      firestore,
      this.collectionName,
      user.uid
    );

    await setDoc(document, user);
  }

  async getById(
    userId: string
  ): Promise<PlatformUser | null> {

    console.log('Looking for user:', userId);

    const document = doc(
      firestore,
      this.collectionName,
      userId
    );

    const snapshot = await getDoc(document);

    console.log('Document exists:', snapshot.exists());

    if (snapshot.exists()) {
      console.log('Document data:', snapshot.data());
    }

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as PlatformUser;
  }

  async update(
    userUid: string,
    changes: Partial<PlatformUser>
  ): Promise<void> {
    const document = doc(
      firestore,
      this.collectionName,
      userUid
    );

    await updateDoc(document, changes);
  }
}