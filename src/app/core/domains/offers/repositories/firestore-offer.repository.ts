import {
  Injectable
} from '@angular/core';

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from 'firebase/firestore';

import {
  httpsCallable
} from 'firebase/functions';

import {
  firestore,
  functions
} from '../../../infrastructure/firebase/firebase';

import {
  Offer,
  OfferSearchFilters,
  OfferSummary
} from '../models/offer.model';

import {
  OfferStatus
} from '../models/offer-status.model';

import {
  OfferVersion
} from '../models/offer-version.model';

import {
  CreateCounterofferRequest,
  CreateCounterofferResult,
  OfferRepository,
  RespondToOfferRequest,
  RespondToOfferResult,
  SaveOfferDraftRequest,
  SubmitOfferVersionRequest
} from './offer.repository';


interface CreateOfferDraftFunctionRequest {
  listingUid: string;
}


interface CreateOfferDraftFunctionResponse {
  offerUid: string;
  offerVersionUid: string;

  referenceNumber: string;

  resumedExistingDraft: boolean;
}


interface SaveOfferDraftFunctionResponse {
  success: true;
}


interface SubmitOfferVersionFunctionResponse {
  success: true;
}


interface WithdrawOfferFunctionRequest {
  offerUid: string;
  offerVersionUid: string;
}


interface WithdrawOfferFunctionResponse {
  success: true;
}


@Injectable({
  providedIn: 'root'
})
export class FirestoreOfferRepository
  extends OfferRepository {

  private readonly createOfferDraftFunction =
    httpsCallable<
      CreateOfferDraftFunctionRequest,
      CreateOfferDraftFunctionResponse
    >(
      functions,
      'createOfferDraft'
    );


  private readonly saveOfferDraftFunction =
    httpsCallable<
      SaveOfferDraftRequest,
      SaveOfferDraftFunctionResponse
    >(
      functions,
      'saveOfferDraft'
    );


  private readonly submitOfferFunction =
    httpsCallable<
      SubmitOfferVersionRequest,
      SubmitOfferVersionFunctionResponse
    >(
      functions,
      'submitOffer'
    );


  private readonly createCounterofferFunction =
    httpsCallable<
      CreateCounterofferRequest,
      CreateCounterofferResult
    >(
      functions,
      'createCounteroffer'
    );


  private readonly respondToOfferFunction =
    httpsCallable<
      RespondToOfferRequest,
      RespondToOfferResult
    >(
      functions,
      'respondToOffer'
    );


  private readonly withdrawOfferFunction =
    httpsCallable<
      WithdrawOfferFunctionRequest,
      WithdrawOfferFunctionResponse
    >(
      functions,
      'withdrawOffer'
    );


  override async getOfferByUid(
    offerUid: string
  ): Promise<Offer | null> {
    const offerReference = doc(
      firestore,
      'offers',
      offerUid
    );

    const snapshot =
      await getDoc(offerReference);

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapDocumentData<Offer>(
      snapshot.id,
      snapshot.data()
    );
  }


  override async getOfferByReferenceNumber(
    referenceNumber: string
  ): Promise<Offer | null> {
    const offersReference =
      collection(
        firestore,
        'offers'
      );

    const offerQuery = query(
      offersReference,
      where(
        'referenceNumber',
        '==',
        referenceNumber
      ),
      limit(1)
    );

    const snapshot =
      await getDocs(offerQuery);

    if (snapshot.empty) {
      return null;
    }

    const offerDocument =
      snapshot.docs[0];

    return this.mapDocumentData<Offer>(
      offerDocument.id,
      offerDocument.data()
    );
  }


  override async getOpenOfferForBuyerAndListing(
    buyerUid: string,
    listingUid: string
  ): Promise<Offer | null> {
    const openStatuses: OfferStatus[] = [
      'draft',
      'submitted',
      'viewed',
      'countered'
    ];

    const offersReference =
      collection(
        firestore,
        'offers'
      );

    const offerQuery = query(
      offersReference,
      where(
        'buyerUids',
        'array-contains',
        buyerUid
      ),
      where(
        'listingUid',
        '==',
        listingUid
      ),
      where(
        'status',
        'in',
        openStatuses
      ),
      limit(1)
    );

    const snapshot =
      await getDocs(offerQuery);

    if (snapshot.empty) {
      return null;
    }

    const offerDocument =
      snapshot.docs[0];

    return this.mapDocumentData<Offer>(
      offerDocument.id,
      offerDocument.data()
    );
  }


  override async getOffersForUser(
    userUid: string,
    filters: OfferSearchFilters
  ): Promise<OfferSummary[]> {
    const offersReference =
      collection(
        firestore,
        'offers'
      );

    const participantField =
      filters.role === 'buyer'
        ? 'buyerUids'
        : 'sellerUids';

    const offerQuery = query(
      offersReference,
      where(
        participantField,
        'array-contains',
        userUid
      ),
      orderBy(
        'lastActivityAt',
        'desc'
      ),
      limit(
        filters.limit ?? 50
      )
    );

    const snapshot =
      await getDocs(offerQuery);

    let offers = snapshot.docs.map(
      offerDocument =>
        this.mapDocumentData<Offer>(
          offerDocument.id,
          offerDocument.data()
        )
    );

    if (
      filters.statuses &&
      filters.statuses.length > 0
    ) {
      const allowedStatuses =
        new Set(filters.statuses);

      offers = offers.filter(
        offer =>
          allowedStatuses.has(
            offer.status
          )
      );
    }

    if (filters.listingUid) {
      offers = offers.filter(
        offer =>
          offer.listingUid ===
          filters.listingUid
      );
    }

    return this.createOfferSummaries(
      offers
    );
  }


  override async getOffersForListing(
    listingUid: string
  ): Promise<OfferSummary[]> {
    const offersReference =
      collection(
        firestore,
        'offers'
      );

    const offerQuery = query(
      offersReference,
      where(
        'listingUid',
        '==',
        listingUid
      ),
      orderBy(
        'lastActivityAt',
        'desc'
      ),
      limit(100)
    );

    const snapshot =
      await getDocs(offerQuery);

    const offers = snapshot.docs.map(
      offerDocument =>
        this.mapDocumentData<Offer>(
          offerDocument.id,
          offerDocument.data()
        )
    );

    return this.createOfferSummaries(
      offers
    );
  }


  override async getOfferVersionByUid(
    offerUid: string,
    offerVersionUid: string
  ): Promise<OfferVersion | null> {
    const versionReference = doc(
      firestore,
      'offers',
      offerUid,
      'versions',
      offerVersionUid
    );

    const snapshot =
      await getDoc(versionReference);

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapDocumentData<OfferVersion>(
      snapshot.id,
      snapshot.data()
    );
  }


  override async getCurrentOfferVersion(
    offerUid: string
  ): Promise<OfferVersion | null> {
    const offer =
      await this.getOfferByUid(
        offerUid
      );

    if (!offer) {
      return null;
    }

    return this.getOfferVersionByUid(
      offerUid,
      offer.currentVersionUid
    );
  }


  override async getOfferVersions(
    offerUid: string
  ): Promise<OfferVersion[]> {
    const versionsReference =
      collection(
        firestore,
        'offers',
        offerUid,
        'versions'
      );

    const versionQuery = query(
      versionsReference,
      orderBy(
        'versionNumber',
        'asc'
      )
    );

    const snapshot =
      await getDocs(versionQuery);

    return snapshot.docs.map(
      versionDocument =>
        this.mapDocumentData<OfferVersion>(
          versionDocument.id,
          versionDocument.data()
        )
    );
  }


  override async createOrResumeOfferDraft(
    listingUid: string
  ): Promise<CreateOfferDraftFunctionResponse> {
    const result =
      await this.createOfferDraftFunction({
        listingUid
      });

    return result.data;
  }


  override async saveOfferDraft(
    request: SaveOfferDraftRequest
  ): Promise<void> {
    await this.saveOfferDraftFunction(
      request
    );
  }


  override async submitOfferVersion(
    request: SubmitOfferVersionRequest
  ): Promise<void> {
    await this.submitOfferFunction(
      request
    );
  }


  override async createCounteroffer(
    request: CreateCounterofferRequest
  ): Promise<CreateCounterofferResult> {
    const result =
      await this.createCounterofferFunction(
        request
      );

    return result.data;
  }


  override async respondToOffer(
    request: RespondToOfferRequest
  ): Promise<RespondToOfferResult> {
    const result =
      await this.respondToOfferFunction(
        request
      );

    return result.data;
  }


  override async withdrawOffer(
    offerUid: string,
    offerVersionUid: string
  ): Promise<void> {
    await this.withdrawOfferFunction({
      offerUid,
      offerVersionUid
    });
  }


  private async createOfferSummaries(
    offers: Offer[]
  ): Promise<OfferSummary[]> {
    const summaries =
      await Promise.all(
        offers.map(
          offer =>
            this.createOfferSummary(
              offer
            )
        )
      );

    return summaries.filter(
      (
        summary
      ): summary is OfferSummary =>
        summary !== null
    );
  }


  private async createOfferSummary(
    offer: Offer
  ): Promise<OfferSummary | null> {
    const version =
      await this.getOfferVersionByUid(
        offer.Uid,
        offer.currentVersionUid
      );

    if (!version) {
      return null;
    }

    const primaryBuyer =
      version.buyers[0];

    const primarySeller =
      version.sellers[0];

    const propertyAddress = [
      offer.property.addressLine1,
      offer.property.addressLine2,
      offer.property.city,
      offer.property.state,
      offer.property.zipCode
    ]
      .filter(
        value =>
          typeof value === 'string' &&
          value.trim().length > 0
      )
      .join(', ');

    return {
      Uid: offer.Uid,

      referenceNumber:
        offer.referenceNumber,

      listingUid:
        offer.listingUid,

      propertyAddress,

      stateCode:
        offer.stateCode,

      primaryBuyerName:
        primaryBuyer?.legalName ?? '',

      primarySellerName:
        primarySeller?.legalName ?? '',

      status:
        offer.status,

      currentVersionUid:
        offer.currentVersionUid,

      currentVersionNumber:
        offer.currentVersionNumber,

      purchasePriceInCents:
        version.terms.purchase
          .purchasePriceInCents,

      expiresAt:
        version.expiresAt,

      submittedAt:
        offer.submittedAt,

      lastActivityAt:
        offer.lastActivityAt
    };
  }


  private mapDocumentData<T>(
    documentUid: string,
    data: Record<string, unknown>
  ): T {
    const normalizedData =
      this.normalizeFirestoreValue(
        data
      ) as Record<string, unknown>;

    return {
      ...normalizedData,
      Uid: documentUid
    } as T;
  }


  private normalizeFirestoreValue(
    value: unknown
  ): unknown {
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    if (Array.isArray(value)) {
      return value.map(
        item =>
          this.normalizeFirestoreValue(
            item
          )
      );
    }

    if (
      value !== null &&
      typeof value === 'object'
    ) {
      return Object.fromEntries(
        Object.entries(
          value as Record<string, unknown>
        ).map(
          ([key, nestedValue]) => [
            key,
            this.normalizeFirestoreValue(
              nestedValue
            )
          ]
        )
      );
    }

    return value;
  }
}