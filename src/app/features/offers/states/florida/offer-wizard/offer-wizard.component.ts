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
  FloridaOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/florida/models/florida-offer-terms.model';

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
  updateFloridaOfferTerms,
} from '../services/florida-offer-terms-updater';

import {
  FLORIDA_OFFER_PACKAGE,
} from '../florida-offer-package';

// A seller counteroffer may negotiate price and concessions, but cannot
// rewrite the buyer's funding, deposit promises, or receipt statements.
const BUYER_OWNED_FIELDS = new Set([
  'purchase.earnestMoneyInCents',
  'purchase.additionalEarnestMoneyInCents',
  'purchase.earnestMoneyHolder',
  'purchase.earnestMoneyDueDays',
  'purchase.financingType',
  'purchase.loanAmountInCents',
  'disclosures.propertyConditionStatus',
  'disclosures.floodStatus',
  'disclosures.taxNoticeAcknowledged',
  'disclosures.radonNoticeAcknowledged',
  'disclosures.leadPaintStatus',
  'disclosures.leadInspectionSelection',
  'disclosures.leadInspectionDays',
  'disclosures.hoaDocumentsStatus',
  'disclosures.leaseStatementAcknowledged',
  'disclosures.hoaDocumentsStatus',
]);


export interface FloridaOfferDraftChange {
  readonly terms: FloridaOfferTerms;
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
    input<FloridaOfferTerms | null>(null);

  readonly saving = input(false);
  readonly submitting = input(false);

  readonly draftChanged =
    output<FloridaOfferDraftChange>();

  readonly documentSelected =
    output<OfferDocumentSelection>();

  readonly submitRequested =
    output<FloridaOfferDraftChange>();

  readonly returnToListingRequested =
    output<void>();

  readonly listingDisclosureRequested =
    output<ListingDisclosureDocument>();

  protected readonly terms =
    signal<FloridaOfferTerms | null>(null);

  protected readonly draftBuyers =
    signal<readonly OfferParty[]>([]);

  protected readonly submissionAttempted =
    signal(false);

  private initialTermsApplied = false;
  private initialBuyersApplied = false;

  protected readonly pendingDisclosureNotice = computed(() => {
    const terms = this.terms();
    if (!terms) return null;

    const outstanding: string[] = [];

    if (terms.disclosures.floodStatus === 'pending') {
      outstanding.push('the seller-signed flood disclosure');
    }

    if (
      terms.disclosures.sellerReportsHoa === true &&
      terms.disclosures.hoaDocumentsStatus === 'pending'
    ) {
      outstanding.push('the HOA disclosure summary');
    }

    if (
      terms.property.yearBuilt != null &&
      terms.property.yearBuilt < 1978 &&
      terms.disclosures.leadPaintStatus === 'pending'
    ) {
      outstanding.push('the federal lead-based paint packet');
    }

    return outstanding.length
      ? `This offer cannot be submitted while ${outstanding.join(', ')} is pending. The seller must upload the document and the buyer must review it before acknowledging receipt. A seller counteroffer cannot change the buyer's receipt answers.`
      : null;
  });

  protected readonly busy = computed(
    () => this.submitting()
  );

  protected readonly contractDefinition = computed(
    () => {
      const terms = this.terms();

      return terms
        ? FLORIDA_OFFER_PACKAGE.contracts[
        terms.contractType
        ]
        : null;
    }
  );

  protected readonly sections = computed(
    () => {
      const terms = this.terms();
      if (!terms) return [];
      const sections = FLORIDA_OFFER_PACKAGE.getSections(terms);
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

      const result = FLORIDA_OFFER_PACKAGE.validate(
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
      for (const [status, path, documentType, label] of [
        [terms.disclosures.leadPaintStatus, 'disclosures.leadPaintStatus', 'lead-based-paint', 'signed lead disclosure packet'],
        [terms.disclosures.propertyConditionStatus, 'disclosures.propertyConditionStatus', 'florida-seller-property-disclosure', 'seller-signed Florida property condition statement'],
        [terms.disclosures.floodStatus, 'disclosures.floodStatus', 'florida-flood-disclosure', 'seller-signed statutory flood disclosure'],
        [terms.disclosures.hoaDocumentsStatus, 'disclosures.hoaDocumentsStatus', 'florida-hoa-disclosure-summary', 'seller-provided HOA disclosure summary'],
      ] as const) {
        if (status === 'received' && !attached.has(documentType)) missing.push({ fieldPath: path, severity: 'error', message: `The seller must upload the ${label} to the listing before it can be marked received.` });
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

    if (this.initiatedBy() === 'seller' && BUYER_OWNED_FIELDS.has(change.fieldPath)) {
      return;
    }

    const updatedTerms =
      updateFloridaOfferTerms(
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
      updateFloridaOfferTerms(
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

    const result = FLORIDA_OFFER_PACKAGE.validate(
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
    terms: FloridaOfferTerms
  ): void {
    this.draftChanged.emit({
      terms,
      expiresAt: terms.delivery.expiresAt,
      buyers: this.draftBuyers(),
    });
  }
}
