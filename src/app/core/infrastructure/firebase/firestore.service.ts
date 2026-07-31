import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import { db } from './firebase';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  collection(path: string): CollectionReference<DocumentData> {
    return collection(db, path);
  }

  document(path: string): DocumentReference<DocumentData> {
    return doc(db, path);
  }

  async getAll<T>(path: string): Promise<T[]> {

    const snapshot = await getDocs(this.collection(path));

    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as T[];

  }

  async get<T>(path: string): Promise<T | null> {

    const snapshot = await getDoc(this.document(path));

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    } as T;

  }

  async add(path: string, data: unknown) {
    return addDoc(this.collection(path), data);
  }

  async set(path: string, data: unknown) {
    return setDoc(this.document(path), data);
  }

  async update(path: string, data: Partial<unknown>) {
    return updateDoc(this.document(path), data);
  }

  async delete(path: string) {
    return deleteDoc(this.document(path));
  }

}