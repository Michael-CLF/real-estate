import {
  Injectable
} from '@angular/core';

import {
  DocumentData,
  DocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  limit as queryLimit,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';

import {
  firestore
} from './firebase';

import {
  ProfessionalUser
} from '../../domains/users/models/professional-user.model';

import {
  InitialProfessionalUser,
  ProfessionalRepository,
  ProfessionalUserChanges
} from '../../domains/users/repositories/professional.repository';

@Injectable({
  providedIn: 'root'
})
export class FirebaseProfessionalRepository
  extends ProfessionalRepository {

  private readonly collectionName =
    'professionalProfiles';

  async createProfessional(
    professional: InitialProfessionalUser
  ): Promise<string> {
    const professionalsCollection =
      collection(
        firestore,
        this.collectionName
      );

    const sanitizedProfessional =
      this.removeUndefinedValues(
        professional
      );

    const documentReference =
      await addDoc(
        professionalsCollection,
        {
          ...sanitizedProfessional,

          submissionCertifiedAt:
            professional.submissionCertified
              ? serverTimestamp()
              : null,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()
        }
      );

    return documentReference.id;
  }

  async getProfessionalByOwnerUid(
    ownerUid: string
  ): Promise<ProfessionalUser | null> {
    if (!ownerUid.trim()) {
      return null;
    }

    const ownerQuery =
      query(
        collection(
          firestore,
          this.collectionName
        ),

        where(
          'ownerUid',
          '==',
          ownerUid
        ),

        queryLimit(1)
      );

    const snapshot =
      await getDocs(ownerQuery);

    const professionalSnapshot =
      snapshot.docs[0];

    if (!professionalSnapshot) {
      return null;
    }

    return this.mapProfessionalSnapshot(
      professionalSnapshot
    );
  }

  async getProfessionalByProfileSlug(
    stateSlug: string,
    profileSlug: string
  ): Promise<ProfessionalUser | null> {
    const normalizedStateSlug =
      stateSlug
        .trim()
        .toLowerCase();

    const normalizedProfileSlug =
      profileSlug
        .trim()
        .toLowerCase();

    if (
      !normalizedStateSlug ||
      !normalizedProfileSlug
    ) {
      return null;
    }

    const profileQuery =
      query(
        collection(
          firestore,
          this.collectionName
        ),

        where(
          'stateSlug',
          '==',
          normalizedStateSlug
        ),

        where(
          'profileSlug',
          '==',
          normalizedProfileSlug
        ),

        where(
          'status',
          '==',
          'active'
        ),

        where(
          'subscriptionStatus',
          '==',
          'profile'
        ),

        queryLimit(1)
      );


    const snapshot =
      await getDocs(profileQuery);

    const professionalSnapshot =
      snapshot.docs[0];

    if (!professionalSnapshot) {
      return null;
    }

    return this.mapProfessionalSnapshot(
      professionalSnapshot
    );
  }

  async getActiveProfessionalsByState(
    stateSlug: string
  ): Promise<ProfessionalUser[]> {
    const normalizedStateSlug =
      stateSlug
        .trim()
        .toLowerCase();

    if (!normalizedStateSlug) {
      return [];
    }

    const stateProfessionalsQuery =
      query(
        collection(
          firestore,
          this.collectionName
        ),

        where(
          'stateSlug',
          '==',
          normalizedStateSlug
        ),

        where(
          'status',
          '==',
          'active'
        )
      );

    const snapshot =
      await getDocs(
        stateProfessionalsQuery
      );

    return snapshot.docs
      .map(documentSnapshot =>
        this.mapProfessionalSnapshot(
          documentSnapshot
        )
      )
      .sort(
        (
          firstProfessional,
          secondProfessional
        ) => {
          const firstPlacement =
            firstProfessional.placement ===
              'sponsored'
              ? 0
              : 1;

          const secondPlacement =
            secondProfessional.placement ===
              'sponsored'
              ? 0
              : 1;

          if (
            firstPlacement !==
            secondPlacement
          ) {
            return (
              firstPlacement -
              secondPlacement
            );
          }

          return firstProfessional
            .businessName
            .localeCompare(
              secondProfessional.businessName
            );
        }
      );
  }

  async updateProfessional(
    professionalUid: string,
    changes: ProfessionalUserChanges
  ): Promise<void> {
    if (!professionalUid.trim()) {
      throw new Error(
        'A professional record is required.'
      );
    }

    const professionalReference =
      doc(
        firestore,
        this.collectionName,
        professionalUid
      );

    const sanitizedChanges =
      this.removeUndefinedValues(
        changes
      );

    await updateDoc(
      professionalReference,
      {
        ...sanitizedChanges,
        updatedAt:
          serverTimestamp()
      }
    );
  }

  private mapProfessionalSnapshot(
    snapshot:
      DocumentSnapshot<DocumentData>
  ): ProfessionalUser {
    const data =
      snapshot.data();

    if (!data) {
      throw new Error(
        `Professional record ${snapshot.id} contains no data.`
      );
    }

    return {
      ...data,

      uid:
        snapshot.id,

      specialties:
        this.toStringArray(
          data['specialties']
        ),

      counties:
        this.toStringArray(
          data['counties']
        ),

      cities:
        this.toStringArray(
          data['cities']
        ),

      submissionCertifiedAt:
        this.toOptionalDate(
          data['submissionCertifiedAt']
        ),

      createdAt:
        this.toDate(
          data['createdAt']
        ),

      updatedAt:
        this.toDate(
          data['updatedAt']
        )
    } as ProfessionalUser;
  }

  private toStringArray(
    value: unknown
  ): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is string =>
        typeof item === 'string'
    );
  }

  private toDate(
    value: unknown
  ): Date {
    if (value instanceof Date) {
      return value;
    }

    if (value instanceof Timestamp) {
      return value.toDate();
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof value.toDate === 'function'
    ) {
      return value.toDate();
    }

    return new Date();
  }

  private toOptionalDate(
    value: unknown
  ): Date | undefined {
    if (
      value === undefined ||
      value === null
    ) {
      return undefined;
    }

    return this.toDate(value);
  }

  private removeUndefinedValues<T>(
    value: T
  ): T {
    if (Array.isArray(value)) {
      return value.map(item =>
        this.removeUndefinedValues(item)
      ) as T;
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !(value instanceof Timestamp)
    ) {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) =>
            item !== undefined
          )
          .map(([key, item]) => [
            key,
            this.removeUndefinedValues(
              item
            )
          ])
      ) as T;
    }

    return value;
  }
}