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
  CaliforniaOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/california/models/california-offer-terms.model';

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
  updateCaliforniaOfferTerms,
} from '../services/california-offer-terms-updater';

import {
  CALIFORNIA_OFFER_PACKAGE,
} from '../california-offer-package';

// A seller counteroffer may negotiate price and concessions, but cannot
// rewrite the buyer's funding, deposit promises, or receipt statements.
const BUYER_OWNED_FIELDS = new Set([
  'purchase.financingType','purchase.loanAmountInCents','purchase.loanTermYears',
  'conditions.financing','conditions.appraisal','conditions.saleOfBuyersProperty','conditions.additionalEarnestMoney',
  'disclosures.propertyConditionStatus','disclosures.naturalHazardStatus','disclosures.fireHardeningStatus',
  'disclosures.defensibleSpaceStatus','disclosures.renovationStatus','disclosures.waterTankStatus',
  'disclosures.hoaDocumentsStatus','disclosures.leadPaintStatus','disclosures.leadExemptionBasis',
  'disclosures.leadInspectionSelection','disclosures.leadInspectionDays','disclosures.leaseStatementAcknowledged','disclosures.californiaNoticesAcknowledged',
]);


export interface CaliforniaOfferDraftChange {
  readonly terms: CaliforniaOfferTerms;
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
    input<CaliforniaOfferTerms | null>(null);

  readonly saving = input(false);
  readonly submitting = input(false);

  readonly draftChanged =
    output<CaliforniaOfferDraftChange>();

  readonly documentSelected =
    output<OfferDocumentSelection>();

  readonly submitRequested =
    output<CaliforniaOfferDraftChange>();

  readonly returnToListingRequested =
    output<void>();

  readonly listingDisclosureRequested =
    output<ListingDisclosureDocument>();

  protected readonly terms =
    signal<CaliforniaOfferTerms | null>(null);

  protected readonly draftBuyers =
    signal<readonly OfferParty[]>([]);

  protected readonly submissionAttempted =
    signal(false);

  private initialTermsApplied = false;
  private initialBuyersApplied = false;

  protected readonly pendingDisclosureNotice = computed(() => {
    const terms = this.terms();
    if (!terms) return null;
    const pending = Object.entries(terms.disclosures).some(([key,value]) => key.endsWith('Status') && value === 'pending');
    return pending ? 'Answer receipt questions truthfully. Pending California seller documents do not prevent a normal resale offer. Deliver them promptly; late statutory disclosures can create cancellation rights. Applicable federal lead materials must be received before this offer is submitted for signature.' : null;
  });


  protected readonly busy = computed(
    () => this.submitting()
  );

  protected readonly contractDefinition = computed(
    () => {
      const terms = this.terms();

      return terms
        ? CALIFORNIA_OFFER_PACKAGE.contracts[
        terms.contractType
        ]
        : null;
    }
  );

  protected readonly sections = computed(
    () => {
      const terms = this.terms();
      if (!terms) return [];
      const sections = CALIFORNIA_OFFER_PACKAGE.getSections(terms);
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

      const result = CALIFORNIA_OFFER_PACKAGE.validate(
        terms,
        this.draftBuyers(),
        this.sellers(),
        {
          // Apply signature-readiness rules before leaving their section.
          mode: 'submit',
          currentDateTime: new Date(),
        }
      );

      const attached = new Set(this.listingDisclosures().map(document => document.documentType));
      const missing: OfferValidationIssue[] = [];
      for (const [status, path, documentType, label] of [
        [terms.disclosures.propertyConditionStatus, 'disclosures.propertyConditionStatus', 'california-transfer-disclosure', 'TDS'],
        [terms.disclosures.naturalHazardStatus, 'disclosures.naturalHazardStatus', 'california-natural-hazard-disclosure', 'NHD'],
        [terms.disclosures.fireHardeningStatus, 'disclosures.fireHardeningStatus', 'california-fire-hardening', 'fire-hardening disclosure'],
        [terms.disclosures.defensibleSpaceStatus, 'disclosures.defensibleSpaceStatus', 'california-defensible-space', 'defensible-space documentation'],
        [terms.disclosures.renovationStatus, 'disclosures.renovationStatus', 'california-recent-renovations', 'recent-renovation records'],
        [terms.disclosures.waterTankStatus, 'disclosures.waterTankStatus', 'california-assisted-water-tank', 'assisted water tank statement'],
        [terms.disclosures.hoaDocumentsStatus, 'disclosures.hoaDocumentsStatus', 'california-association-documents', 'association resale package'],
        [terms.disclosures.leadPaintStatus, 'disclosures.leadPaintStatus', 'lead-based-paint', 'federal lead packet'],
      ] as const) {
        if (status === 'received' && (!attached.has(documentType) || !terms.documentVersions[documentType])) missing.push({ fieldPath: path, severity: 'error', message: `The seller must upload the ${label} to the listing before it can be marked received.` });
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
      updateCaliforniaOfferTerms(
        currentTerms,
        change.fieldPath,
        change.value
      );

    const receiptTypes: Record<string,string> = {
      propertyConditionStatus:'california-transfer-disclosure',naturalHazardStatus:'california-natural-hazard-disclosure',
      fireHardeningStatus:'california-fire-hardening',defensibleSpaceStatus:'california-defensible-space',
      renovationStatus:'california-recent-renovations',waterTankStatus:'california-assisted-water-tank',
      hoaDocumentsStatus:'california-association-documents',leadPaintStatus:'lead-based-paint',
    };
    const type=receiptTypes[change.fieldPath.replace('disclosures.','')];
    const versions={...updatedTerms.documentVersions};
    if(type) {
      const document=this.listingDisclosures().find(d=>d.documentType===type);
      if(change.value==='received' && document) versions[type]=document.versionId;
      else delete versions[type];
    }
    this.terms.set({...updatedTerms,documentVersions:versions});
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
      updateCaliforniaOfferTerms(
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

    const result = CALIFORNIA_OFFER_PACKAGE.validate(
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
    terms: CaliforniaOfferTerms
  ): void {
    this.draftChanged.emit({
      terms,
      expiresAt: terms.delivery.expiresAt,
      buyers: this.draftBuyers(),
    });
  }
}