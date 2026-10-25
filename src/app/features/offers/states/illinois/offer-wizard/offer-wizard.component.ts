import {ILLINOIS_RADON_ASSET} from '../../../../../core/domains/offers/state-contracts/illinois/illinois-radon-receipt-policy';
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
  IllinoisOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/illinois/models/illinois-offer-terms.model';

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
  updateIllinoisOfferTerms,
} from '../services/illinois-offer-terms-updater';

import {
  ILLINOIS_OFFER_PACKAGE,
} from '../illinois-offer-package';

// A seller counteroffer may negotiate price and concessions, but cannot
// rewrite the buyer's funding, deposit promises, or receipt statements.
const BUYER_OWNED_FIELDS = new Set([
  'disclosures.buyerUsesBroker',
  'purchase.earnestMoneyInCents',
  'purchase.additionalEarnestMoneyInCents',
  'purchase.earnestMoneyHolder',
  'purchase.earnestMoneyDueDays',
  'purchase.financingType',
  'purchase.loanAmountInCents',
  'disclosures.propertyConditionStatus',
  'disclosures.statutoryPacketStatus',
  'disclosures.taxNoticeAcknowledged',
  'disclosures.radonNoticeAcknowledged',
  'disclosures.leadPaintStatus',
  'disclosures.leadInspectionSelection',
  'disclosures.leadInspectionDays',
  'disclosures.hoaDocumentsStatus',
  'disclosures.leaseStatementAcknowledged',
  'disclosures.hoaDocumentsStatus',
]);


export interface IllinoisOfferDraftChange {
  readonly terms: IllinoisOfferTerms;
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
    input<IllinoisOfferTerms | null>(null);

  readonly saving = input(false);
  readonly submitting = input(false);

  readonly draftChanged =
    output<IllinoisOfferDraftChange>();

  readonly documentSelected =
    output<OfferDocumentSelection>();

  readonly submitRequested =
    output<IllinoisOfferDraftChange>();

  readonly returnToListingRequested =
    output<void>();

  readonly listingDisclosureRequested =
    output<ListingDisclosureDocument>();

  protected readonly terms =
    signal<IllinoisOfferTerms | null>(null);

  protected readonly draftBuyers =
    signal<readonly OfferParty[]>([]);

  protected readonly submissionAttempted =
    signal(false);

  protected readonly radonFactSheetUrl=ILLINOIS_RADON_ASSET;

  private initialTermsApplied = false;
  private initialBuyersApplied = false;

  protected readonly pendingDisclosureNotice = computed(() => {
    const terms = this.terms();
    if (!terms) return null;

    return terms.disclosures.leadPaintStatus === 'pending' ? 'Applicable federal lead records must be uploaded and reviewed before signing.' : "Review and acknowledge the applicable seller disclosures before submitting. Optional supporting records do not block an offer.";
  });

  protected readonly busy = computed(
    () => this.submitting()
  );

  protected readonly contractDefinition = computed(
    () => {
      const terms = this.terms();

      return terms
        ? ILLINOIS_OFFER_PACKAGE.contracts[
        terms.contractType
        ]
        : null;
    }
  );

  protected readonly sections = computed(
    () => {
      const terms = this.terms();
      if (!terms) return [];
      const sections = ILLINOIS_OFFER_PACKAGE.getSections(terms);
      if (this.initiatedBy() !== 'seller') return sections;
      return sections.map(section => ({
        ...section,
        questions: section.questions.map(question =>
          question.fieldPath && BUYER_OWNED_FIELDS.has(question.fieldPath)
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

      const result = ILLINOIS_OFFER_PACKAGE.validate(
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

      const missing = ILLINOIS_OFFER_PACKAGE.documentReview!.validate(terms, this.listingDisclosures());
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
        this.terms.set(ILLINOIS_OFFER_PACKAGE.prepareTerms?.(initialTerms) ?? initialTerms);
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

    if (this.initiatedBy() === 'seller' && BUYER_OWNED_FIELDS.has(change.fieldPath)) {
      return;
    }

    const updatedTerms =
      updateIllinoisOfferTerms(
        currentTerms,
        change.fieldPath,
        change.value
      );

    this.terms.set(ILLINOIS_OFFER_PACKAGE.documentReview!.applyChange(currentTerms, updatedTerms, change, this.listingDisclosures(), this.initiatedBy()));
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
      updateIllinoisOfferTerms(
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

    const result = ILLINOIS_OFFER_PACKAGE.validate(
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
    terms: IllinoisOfferTerms
  ): void {
    this.draftChanged.emit({
      terms,
      expiresAt: terms.delivery.expiresAt,
      buyers: this.draftBuyers(),
    });
  }
}
