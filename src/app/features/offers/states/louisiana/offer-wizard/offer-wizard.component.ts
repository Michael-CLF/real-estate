import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

import type {
  OfferParty,
} from '../../../../../core/domains/offers/models/offer-party.model';

import type {
  ListingDisclosureDocument,
} from '../../../../../core/domains/disclosures/models/listing-disclosure-document.model';

import type {
  OfferPropertySnapshot,
} from '../../../../../core/domains/offers/models/offer-terms.model';

import type {
  OfferValidationIssue,
} from '../../../../../core/domains/offers/models/offer-validation.model';

import type {
  LouisianaOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/louisiana/models/louisiana-offer-terms.model';

import {
  OfferWizardShellComponent,
} from '../../../engine/offer-wizard-shell/offer-wizard-shell.component';

import type {
  OfferFieldValueChange,
  OfferCoBuyerChange,
} from '../../../engine/offer-wizard-shell/offer-wizard-shell.component';

import type {
  OfferDocumentSelection,
} from '../../../engine/question-renderer/question-renderer.component';

import {
  updateLouisianaOfferTerms,
} from '../services/louisiana-offer-terms-updater';

import {
  LOUISIANA_OFFER_PACKAGE,
} from '../louisiana-offer-package';

// A seller counteroffer may negotiate price and concessions, but cannot
// rewrite the buyer's funding, deposit promises, or receipt statements.
const SELLER_EDITABLE_FIELDS = new Set([
  'purchase.purchasePriceInCents',
  'purchase.sellerConcessionsInCents',
  'purchase.buyerBrokerCompensationInCents',
  'delivery.expiresAt',
]);


export interface LouisianaOfferDraftChange {
  readonly terms: LouisianaOfferTerms;
  readonly expiresAt: string;
  readonly buyers: readonly OfferParty[];
}


@Component({
  selector: 'app-offer-wizard',
  standalone: true,

  imports: [
    OfferWizardShellComponent,
  ],

  templateUrl:
    './offer-wizard.component.html',

  styleUrl:
    './offer-wizard.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OfferWizardComponent {
  readonly property =
    input.required<OfferPropertySnapshot>();

  readonly initiatedBy = input<'buyer' | 'seller'>('buyer');

  readonly buyers =
    input<readonly OfferParty[]>([]);

  readonly sellers =
    input<readonly OfferParty[]>([]);

  readonly listingDisclosures =
    input<readonly ListingDisclosureDocument[]>([]);

  readonly expiresAt = input.required<string>();
  readonly timeZone = input.required<string>();

  readonly initialTerms =
    input<LouisianaOfferTerms | null>(null);

  readonly saving = input(false);
  readonly submitting = input(false);

  readonly draftChanged =
    output<LouisianaOfferDraftChange>();

  readonly documentSelected =
    output<OfferDocumentSelection>();

  readonly submitRequested =
    output<LouisianaOfferDraftChange>();

  readonly returnToListingRequested =
    output<void>();

  readonly listingDisclosureRequested =
    output<ListingDisclosureDocument>();

  protected readonly terms =
    signal<LouisianaOfferTerms | null>(null);

  protected readonly draftBuyers =
    signal<readonly OfferParty[]>([]);

  protected readonly submissionAttempted =
    signal(false);

  private initialTermsApplied = false;
  private initialBuyersApplied = false;

protected readonly pendingDisclosureNotice = computed(() => {
  const terms = this.terms();
  if (!terms) return null;

  if (terms.disclosures.propertyDisclosureStatus !== 'received') {
    return 'The seller-signed Louisiana Property Disclosure Document must be uploaded and received before you submit this offer.';
  }

  if (terms.disclosures.leadPaintStatus === 'pending') {
    return 'You may send this offer now. The seller cannot accept this version. After the seller provides the lead packet, review it and submit a new offer.';
  }

  return null;
});

  protected readonly busy = computed(
    () => this.saving() || this.submitting()
  );

  protected readonly contractDefinition = computed(
    () => {
      const terms = this.terms();

      return terms
        ? LOUISIANA_OFFER_PACKAGE.contracts[
        terms.contractType
        ]
        : null;
    }
  );

  protected readonly sections = computed(
    () => {
      const terms = this.terms();
      if (!terms) return [];
      const sections = LOUISIANA_OFFER_PACKAGE.getSections(terms);
      if (this.initiatedBy() !== 'seller') return sections;
      return sections.map(section => ({
        ...section,
        questions: section.questions.map(question =>
          question.fieldPath && !SELLER_EDITABLE_FIELDS.has(question.fieldPath)
            ? { ...question, readOnly: true }
            : question
        ),
      }));
    }
  );

  protected readonly validationIssues = computed<
    readonly OfferValidationIssue[]
  >(
    () => {
      const terms = this.terms();

      if (!terms) {
        return [];
      }

      const result = LOUISIANA_OFFER_PACKAGE.validate(
        terms,
        this.draftBuyers(),
        this.sellers(),
        {
          mode: this.submissionAttempted()
            ? 'submit'
            : 'draft',
          currentDateTime: new Date(),
        }
      );

      const attached = new Set(this.listingDisclosures().map(document => document.documentType));
      const missing: OfferValidationIssue[] = [];
      if (terms.disclosures.propertyDisclosureStatus === 'received' && !attached.has('louisiana-property-disclosure')) {
        missing.push({ fieldPath: 'disclosures.propertyDisclosureStatus', severity: 'error', message: 'The seller must upload the signed Louisiana disclosure to this listing.' });
      }
      if (terms.disclosures.leadPaintStatus === 'received' && !attached.has('lead-based-paint')) {
        missing.push({ fieldPath: 'disclosures.leadPaintStatus', severity: 'error', message: 'The seller must upload the signed lead disclosure packet.' });
      }
      return [...result.errors, ...missing, ...result.warnings];
    }
  );


  constructor() {
    effect(() => {
      const initialTerms = this.initialTerms();

      if (
        !this.initialTermsApplied &&
        initialTerms
      ) {
        this.terms.set(initialTerms);
        this.initialTermsApplied = true;
      }
    });

    effect(() => {
      const buyers = this.buyers();
      if (!this.initialBuyersApplied && buyers.length > 0) {
        this.draftBuyers.set(buyers);
        this.initialBuyersApplied = true;
      }
    });
  }


  protected onFieldValueChange(
    change: OfferFieldValueChange
  ): void {
    const currentTerms = this.terms();

    if (!currentTerms || this.busy()) {
      return;
    }

    if (this.initiatedBy() === 'seller' && !SELLER_EDITABLE_FIELDS.has(change.fieldPath)) {
      return;
    }

    const updatedTerms =
      updateLouisianaOfferTerms(
        currentTerms,
        change.fieldPath,
        change.value
      );

    this.terms.set(updatedTerms);
    this.submissionAttempted.set(false);
  }


  protected onSectionChanged(): void {
    const currentTerms = this.terms();

    if (!currentTerms || this.busy()) {
      return;
    }

    this.emitDraftChange(currentTerms);
  }


  protected onCoBuyerChanged(
    change: OfferCoBuyerChange | null
  ): void {
    if (this.initiatedBy() !== 'buyer') return;
    const primaryBuyer = this.draftBuyers()[0];

    if (!primaryBuyer) {
      return;
    }

    if (!change) {
      this.draftBuyers.set([primaryBuyer]);
      return;
    }

    const nameParts = change.legalName
      .split(/\s+/)
      .filter(Boolean);

    const coBuyer: OfferParty = {
      Uid: this.draftBuyers()[1]?.Uid ?? crypto.randomUUID(),
      role: 'buyer',
      capacity: 'individual',
      firstName: nameParts[0] ?? '',
      lastName: nameParts.slice(1).join(' '),
      legalName: change.legalName,
      email: change.email,
      phone: change.phone,
      mailingAddress: primaryBuyer.mailingAddress,
      buyerDetails: {
        intendedUse: primaryBuyer.buyerDetails?.intendedUse ?? 'primary_residence',
        proposedDeedName: change.legalName,
        buyerSequence: 2,
        primaryBuyer: false,
      },
      identityVerification: {
        status: 'not_started',
        provider: 'stripe_identity',
        legalNameApplied: false,
      },
      signature: {
        required: true,
        status: 'not_invited',
      },
      electronicTransactionsConsentAccepted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.draftBuyers.set([primaryBuyer, coBuyer]);
  }


  /*
   * Called by the persistence container after an uploaded
   * document has been registered and a document UID exists.
   */
  applyDocumentUid(
    fieldPath: string,
    documentUid: string
  ): void {
    const currentTerms = this.terms();

    if (!currentTerms) {
      return;
    }

    const updatedTerms =
      updateLouisianaOfferTerms(
        currentTerms,
        fieldPath,
        documentUid
      );

    this.terms.set(updatedTerms);
  }


  protected onSubmitRequested(): void {
    const currentTerms = this.terms();

    if (!currentTerms || this.busy()) {
      return;
    }

    this.submissionAttempted.set(true);

    const result = LOUISIANA_OFFER_PACKAGE.validate(
      currentTerms,
      this.draftBuyers(),
      this.sellers(),
      {
        mode: 'submit',
        currentDateTime: new Date(),
      }
    );

    if (!result.valid || this.validationIssues().some(issue => issue.severity === 'error')) {
      return;
    }

    this.submitRequested.emit({
      terms: currentTerms,
      expiresAt: currentTerms.delivery.expiresAt,
      buyers: this.draftBuyers(),
    });
  }


  private emitDraftChange(
    terms: LouisianaOfferTerms
  ): void {
    this.draftChanged.emit({
      terms,
      expiresAt: terms.delivery.expiresAt,
      buyers: this.draftBuyers(),
    });
  }
}