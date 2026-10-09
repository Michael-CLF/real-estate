import type { DisclosureDocumentType } from '../../../../core/domains/disclosures/models/state-disclosure-requirement.model';
import type { ListingDisclosureDocument } from '../../../../core/domains/disclosures/models/listing-disclosure-document.model';
import type { OfferParty } from '../../../../core/domains/offers/models/offer-party.model';
import type { OfferVersionPartySnapshot } from '../../../../core/domains/offers/models/offer-version.model';
import { firstValueFrom } from 'rxjs';
import type { MarketplaceListing } from '../../../../core/domains/marketplace/models/marketplace-listing.model';
import type { MarketplaceListingRepository } from '../../../../core/domains/marketplace/repositories/marketplace-listing.repository';
import type { Offer } from '../../../../core/domains/offers/models/offer.model';
import type { OfferVersion } from '../../../../core/domains/offers/models/offer-version.model';
import {
  Injectable,
  inject,
} from '@angular/core';
import {
  Router,
} from '@angular/router';
import type {
  StateOfferTerms,
} from '../../../../core/domains/offers/models/offer-terms.model';
import type {
  OfferVersionDraftChanges,
} from '../../../../core/domains/offers/models/offer-version.model';
import {
  OfferService,
} from '../../../../core/domains/offers/services/offer.service';

interface DraftSaveState {
  tail: Promise<void>;
  lastSuccessfulPayload: string | null;
}

/** Provide on each entry component: save state belongs to one editing session. */
@Injectable()
export class OfferWorkflowService {
  private readonly offerService = inject(OfferService);
  private readonly router = inject(Router);
  private readonly saves = new Map<string, DraftSaveState>();
  private readonly submissions = new Map<string, Promise<void>>();

  async loadListing(
    listingUid: string,
    repository: MarketplaceListingRepository,
    suppliedListing: MarketplaceListing | null,
  ): Promise<MarketplaceListing | null> {
    if (suppliedListing?.uid === listingUid) return suppliedListing;
    return firstValueFrom(repository.getListingById(listingUid));
  }

  async loadOfferVersion<TTerms extends StateOfferTerms>(
    offerUid: string,
    versionUid: string,
  ): Promise<readonly [Offer | null, OfferVersion<TTerms> | null]> {
    return Promise.all([
      this.offerService.getOffer(offerUid),
      this.offerService.getVersion<TTerms>(offerUid, versionUid),
    ]);
  }

  async loadValidatedOfferVersion<TTerms extends StateOfferTerms>(
    offerUid: string,
    versionUid: string,
    stateCode: string,
    stateName: string,
    expectedContractType?: string,
  ): Promise<readonly [Offer, OfferVersion<TTerms>]> {
    const [offer, version] = await this.loadOfferVersion<TTerms>(offerUid, versionUid);
    if (!offer || !version) {
      throw new Error(`The ${stateName} offer draft could not be loaded.`);
    }
    if (offer.stateCode !== stateCode || version.stateCode !== stateCode ||
        version.terms.stateCode !== stateCode) {
      throw new Error(`The saved offer does not contain a ${stateName} contract.`);
    }
    if (expectedContractType &&
        (version.terms as unknown as Record<string, unknown>)['contractType'] !== expectedContractType) {
      throw new Error(`The existing draft uses a different ${stateName} contract form.`);
    }
    return [offer, version];
  }

  toOfferParties(
    parties:
      readonly OfferVersionPartySnapshot[]
  ): readonly OfferParty[] {
    return parties.map(party => ({
      Uid: party.partyUid,
      role: party.role,
      capacity: party.capacity,
      ...(party.userUid ? { userUid: party.userUid } : {}),
      firstName: party.firstName,
      ...(party.middleName ? { middleName: party.middleName } : {}),
      lastName: party.lastName,
      ...(party.suffix ? { suffix: party.suffix } : {}),
      legalName: party.legalName,
      email: party.email,
      phone: party.phone,
      mailingAddress: party.mailingAddress,
      ...(party.role === 'buyer'
        ? {
          buyerDetails: {
            intendedUse: party.intendedUse ?? 'primary_residence',
            proposedDeedName: party.proposedDeedName ?? party.legalName,
            buyerSequence: party.sequence,
            primaryBuyer: party.primaryParty,
          },
        }
        : {
          sellerDetails: {
            sellerSequence: party.sequence,
            primarySeller: party.primaryParty,
            listingOwner: party.primaryParty,
          },
        }),
      identityVerification: party.identityVerification,
      signature: {
        required: party.requiredSigner,
        status: party.signature.status === 'not_started'
          ? 'not_invited'
          : party.signature.status,
        ...(party.signature.providerEnvelopeUid
          ? { providerEnvelopeUid: party.signature.providerEnvelopeUid }
          : {}),
        ...(party.signature.providerSignerUid
          ? { providerSignerUid: party.signature.providerSignerUid }
          : {}),
      },
      electronicTransactionsConsentAccepted:
        party.electronicTransactionsConsentAccepted,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }));
  }
  toOfferVersionPartySnapshot(
    party: OfferParty
  ): OfferVersionPartySnapshot {
    return {
      partyUid: party.Uid,
      ...(party.userUid ? { userUid: party.userUid } : {}),
      role: party.role,
      capacity: party.capacity,
      firstName: party.firstName,
      ...(party.middleName ? { middleName: party.middleName } : {}),
      lastName: party.lastName,
      ...(party.suffix ? { suffix: party.suffix } : {}),
      legalName: party.legalName,
      email: party.email,
      phone: party.phone,
      mailingAddress: party.mailingAddress,
      sequence:
        party.buyerDetails?.buyerSequence ??
        party.sellerDetails?.sellerSequence ??
        1,
      primaryParty:
        party.buyerDetails?.primaryBuyer ??
        party.sellerDetails?.primarySeller ??
        false,
      ...(party.buyerDetails
        ? {
          intendedUse: party.buyerDetails.intendedUse,
          proposedDeedName: party.buyerDetails.proposedDeedName,
        }
        : {}),
      requiredSigner: party.signature.required,
      identityVerification: party.identityVerification,
      signature: {
        status: party.signature.status === 'not_invited'
          ? 'not_started'
          : party.signature.status,
        ...(party.signature.providerEnvelopeUid
          ? { providerEnvelopeUid: party.signature.providerEnvelopeUid }
          : {}),
        ...(party.signature.providerSignerUid
          ? { providerSignerUid: party.signature.providerSignerUid }
          : {}),
      },
      electronicTransactionsConsentAccepted:
        party.electronicTransactionsConsentAccepted,
      ...(party.electronicTransactionsConsentAcceptedAt
        ? {
          electronicTransactionsConsentAcceptedAt:
            party.electronicTransactionsConsentAcceptedAt,
        }
        : {}),
    };
  }

  async findResumableDraft(
    listingUid: string,
    repository: { getOpenOfferForBuyerAndListing(buyerUid: string, listingUid: string): Promise<Offer | null> },
  ): Promise<Offer | null> {
    const offer = await repository.getOpenOfferForBuyerAndListing(this.offerService.currentUserUid, listingUid);
    if (offer && offer.status !== 'draft') {
      throw new Error('You already have an active offer for this property. Open it from your Offers dashboard.');
    }
    return offer;
  }

  buildDraftChanges<TTerms extends StateOfferTerms & { contractType: string }>(
    stateCode: string,
    change: { terms: TTerms; expiresAt: string; buyers: readonly OfferParty[] },
    includeBuyers: boolean,
  ): OfferVersionDraftChanges<TTerms> {
    return {
      terms: change.terms,
      expiresAt: change.expiresAt,
      ...(includeBuyers
        ? { buyers: change.buyers.map(buyer => this.toOfferVersionPartySnapshot(buyer)) }
        : {}),
      wizardData: { stateCode, contractType: change.terms.contractType },
    };
  }

  saveDraft<TTerms extends StateOfferTerms>(
    offerUid: string,
    versionUid: string,
    changes: OfferVersionDraftChanges<TTerms>,
  ): Promise<void> {
    const key = JSON.stringify([offerUid, versionUid]);
    const snapshot = JSON.stringify(changes);
    // Capture the actual request before a caller can mutate its form values.
    const payload = structuredClone(changes);
    let state = this.saves.get(key);
    if (!state) {
      state = { tail: Promise.resolve(), lastSuccessfulPayload: null };
      this.saves.set(key, state);
    }
    const saveState = state;
    const operation = state.tail.catch(() => undefined).then(async () => {
      if (saveState.lastSuccessfulPayload === snapshot) return;
      try {
        await this.offerService.saveDraft(offerUid, versionUid, payload);
        saveState.lastSuccessfulPayload = snapshot;
      } catch (error) {
        // A failed request may have an uncertain outcome; the next save retries.
        saveState.lastSuccessfulPayload = null;
        throw error;
      }
    });
    state.tail = operation;
    return operation;
  }

  assertCurrentEditableDraft<TTerms extends StateOfferTerms>(
    offer: Offer,
    version: OfferVersion<TTerms>,
    listingUid: string,
  ): void {
    if (offer.listingUid !== listingUid || offer.currentVersionUid !== version.Uid ||
        version.status !== 'draft' || offer.status !== 'draft' ||
        version.initiatedByUid !== this.offerService.currentUserUid) {
      throw new Error('This is not your current editable draft version.');
    }
  }

  async restoreAcknowledgedDisclosures(
    listingUid: string,
    documentVersions: Readonly<Record<string, string>>,
    readVersion: (
      listingUid: string,
      documentType: DisclosureDocumentType,
      versionId: string,
    ) => Promise<ListingDisclosureDocument | null>,
    currentDocuments: () => readonly ListingDisclosureDocument[],
  ): Promise<ListingDisclosureDocument[]> {
    const exactDocuments = await Promise.all(Object.entries(documentVersions).map(([type, id]) =>
      readVersion(listingUid, type as DisclosureDocumentType, id)));
    const documents = [...currentDocuments()];
    for (const exact of exactDocuments) {
      if (!exact) throw new Error('A disclosure version acknowledged in this offer is missing.');
      const index = documents.findIndex(document => document.documentType === exact.documentType);
      if (index >= 0) documents[index] = exact;
      else documents.push(exact);
    }
    return documents;
  }

  async createAndLoadDraft(
    listingUid: string,
    contractType: string,
    loadSession: (offerUid: string, versionUid: string, contractType: string) => Promise<void>,
  ): Promise<void> {
    const result = await this.offerService.createOrResumeDraft(listingUid, contractType);
    await loadSession(result.offerUid, result.offerVersionUid, contractType);
  }

  async uploadAndSaveAttachment(
    upload: () => Promise<{ documentUid: string }>,
    applyDocumentUid: (documentUid: string) => void,
    flushDraftSave: () => Promise<void>,
  ): Promise<void> {
    const result = await upload();
    applyDocumentUid(result.documentUid);
    await flushDraftSave();
  }

  async saveAndSubmit(
    flushDraftSave: () => Promise<void>,
    offerUid: string,
    versionUid: string,
    versionNumber: number,
  ): Promise<void> {
    await flushDraftSave();
    await this.submitAndPrepareAgreement(offerUid, versionUid, versionNumber);
  }

  async saveAndReturnToListing(
    flushDraftSave: () => Promise<void>,
    listingUid: string,
  ): Promise<void> {
    try {
      await flushDraftSave();
    } catch {
      return;
    }
    await this.router.navigate(['/listings', listingUid]);
  }

  async submitAndPrepareAgreement(
    offerUid: string,
    versionUid: string,
    versionNumber: number,
  ): Promise<void> {
    const key = JSON.stringify([offerUid, versionUid]);
    await this.saves.get(key)?.tail;
    let submission = this.submissions.get(key);
    if (!submission) {
      submission = this.offerService.submitVersion(offerUid, versionUid);
      this.submissions.set(key, submission);
    }
    try {
      await submission;
    } catch (error) {
      this.submissions.delete(key);
      throw error;
    }
    // The details page prepares the immutable agreement after it renders.
    const navigated = await this.router.navigate(['/offers', offerUid]);
    if (!navigated) throw new Error('The offer was submitted, but its details page could not be opened.');
  }
}
