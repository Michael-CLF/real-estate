import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  AbstractControl,
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';


@Component({
  selector:
    'app-offer-review-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './offer-review-section.component.html',

  styleUrl:
    './offer-review-section.component.scss',

  viewProviders: [
    {
      provide:
        ControlContainer,

      useExisting:
        FormGroupDirective
    }
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class OfferReviewSectionComponent {

  private readonly parentFormDirective =
    inject(FormGroupDirective);

  private readonly currencyFormatter =
    new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );

  get offerForm(): FormGroup {
    return this.parentFormDirective.form;
  }

  get sectionForm(): FormGroup {
    const section =
      this.offerForm.get(
        'offerReview'
      );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The offerReview offer section is unavailable.'
      );
    }

    return section;
  }

  get buyerFullName(): string {
    return [
      this.value(
        'buyerProperty.buyerFirstName'
      ),

      this.value(
        'buyerProperty.buyerMiddleName'
      ),

      this.value(
        'buyerProperty.buyerLastName'
      ),

      this.value(
        'buyerProperty.buyerSuffix'
      )
    ]
      .filter(Boolean)
      .join(' ') ||
      'Not provided';
  }

  get propertyAddress(): string {
    const street =
      this.value(
        'buyerProperty.propertyAddress'
      );

    const city =
      this.value(
        'buyerProperty.propertyCity'
      );

    const stateAndZip = [
      this.value(
        'buyerProperty.propertyState'
      ),

      this.value(
        'buyerProperty.propertyPostalCode'
      )
    ]
      .filter(Boolean)
      .join(' ');

    return [
      street,
      city,
      stateAndZip
    ]
      .filter(Boolean)
      .join(', ') ||
      'Not provided';
  }

  get financingMethodLabel(): string {
    switch (
    this.value(
      'priceFinancing.financingMethod'
    )
    ) {
      case 'cash':
        return 'All cash—no loan';

      case 'loan':
        return 'Buyer intends to obtain a loan';

      default:
        return 'Not selected';
    }
  }

  get dueDiligenceDeadlineLabel(): string {
    const deadlineType =
      this.value(
        'depositsDueDiligence.dueDiligenceDeadlineType'
      );

    if (deadlineType === 'specific_date') {
      return (
        '5:00 p.m. Eastern Time on ' +
        this.dateValue(
          'depositsDueDiligence.dueDiligenceEndDate'
        )
      );
    }

    if (
      deadlineType ===
        'days_after_effective_date'
    ) {
      const days =
        this.value(
          'depositsDueDiligence.dueDiligenceDaysAfterEffectiveDate'
        );

      return (
        '5:00 p.m. Eastern Time on day ' +
        (days || 'not provided') +
        ' after the Effective Date'
      );
    }

    return 'Not selected';
  }

  get depositDeliveryLabel(): string {
    const days = Number(
      this.value(
        'depositsDueDiligence.depositDeliveryDays'
      )
    );

    if (!Number.isInteger(days) || days < 1) {
      return 'Not provided';
    }

    return [
      'Within',
      days,
      days === 1
        ? 'calendar day'
        : 'calendar days',
      'after the Effective Date'
    ].join(' ');
  }

  get concessionLabel(): string {
    switch (
    this.value(
      'concessions.concessionType'
    )
    ) {
      case 'amount':
        return this.currencyValue(
          'concessions.sellerConcessionAmount'
        );

      case 'percentage':
        return (
          this.value(
            'concessions.sellerConcessionPercentage'
          ) || '0'
        ) + '% of the Purchase Price';

      default:
        return 'None';
    }
  }

  get possessionTimingLabel(): string {
    return this.value(
      'settlementPossession.possessionTiming'
    ) === 'other'
      ? 'Other—separate possession agreement attached'
      : 'At Closing';
  }

  get residentialDisclosureLabel(): string {
    return this.disclosureStatusLabel(
      'disclosuresAddenda.residentialPropertyStatus'
    );
  }

  get mineralDisclosureLabel(): string {
    return this.disclosureStatusLabel(
      'disclosuresAddenda.mineralOilGasRightsStatus'
    );
  }

  get additionalTermsLabel(): string {
    if (
      !this.booleanValue(
        'additionalTerms.hasAdditionalTerms'
      )
    ) {
      return 'No exhibit included';
    }

    const preparedBy =
      this.value(
        'additionalTerms.preparedBy'
      );

    const labels:
      Record<string, string> = {
      attorney: 'Exhibit prepared by an attorney',
      buyer: 'Exhibit prepared by the buyer',
      seller: 'Exhibit prepared by the seller'
    };

    return labels[preparedBy] ??
      'Exhibit included—preparer not selected';
  }

  get requiredAttachmentIssues(): string[] {
    const issues: string[] = [];

    if (
      this.value(
        'settlementPossession.possessionTiming'
      ) === 'other' &&
      !this.hasText(
        'settlementPossession.possessionAgreementDocumentUid'
      )
    ) {
      issues.push(
        'Separate possession agreement'
      );
    }

    if (
      this.booleanValue(
        'additionalTerms.hasAdditionalTerms'
      ) &&
      !this.hasText(
        'additionalTerms.documentUid'
      )
    ) {
      issues.push(
        'Additional Terms Exhibit'
      );
    }

    return issues;
  }

  get allPriorSectionsValid(): boolean {
    return this.incompleteSectionLabels
      .length === 0;
  }

  get incompleteSectionLabels(): string[] {
    const sections = [
      {
        controlName: 'buyerProperty',
        label: 'Section 1 — Buyer and Property'
      },
      {
        controlName: 'priceFinancing',
        label: 'Section 2 — Purchase Price and Funding'
      },
      {
        controlName: 'depositsDueDiligence',
        label: 'Section 3 — Deposit and Due Diligence'
      },
      {
        controlName: 'concessions',
        label: 'Section 4 — Seller Concessions'
      },
      {
        controlName: 'propertyInclusions',
        label: 'Section 5 — Property Inclusions and Exclusions'
      },
      {
        controlName: 'settlementPossession',
        label: 'Section 6 — Settlement and Possession'
      },
      {
        controlName: 'disclosuresAddenda',
        label: 'Section 7 — Buyer Disclosure Acknowledgements'
      },
      {
        controlName: 'additionalTerms',
        label: 'Section 8 — Additional Terms Exhibit'
      },
      {
        controlName: 'offerExpiration',
        label: 'Section 9 — Offer Expiration'
      }
    ];

    return sections
      .filter(
        section => {
          const sectionControl =
            this.offerForm.get(
              section.controlName
            );

          return !(
            sectionControl?.valid === true ||
            sectionControl?.disabled === true
          );
        }
      )
      .map(
        section => section.label
      );
  }

  get readyForCertification(): boolean {
    return (
      this.allPriorSectionsValid &&
      this.requiredAttachmentIssues
        .length === 0
    );
  }

  control(
    controlName: string
  ): AbstractControl | null {
    return this.sectionForm.get(
      controlName
    );
  }

  isInvalid(
    controlName: string
  ): boolean {
    const control =
      this.control(
        controlName
      );

    return Boolean(
      control &&
      control.invalid &&
      (
        control.touched ||
        control.dirty
      )
    );
  }

  value(
    path: string
  ): string {
    const value =
      this.offerForm.get(
        path
      )?.value;

    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value);
  }

  booleanValue(
    path: string
  ): boolean {
    return (
      this.offerForm.get(
        path
      )?.value === true
    );
  }

  yesNoValue(
    path: string
  ): string {
    return this.booleanValue(path)
      ? 'Yes'
      : 'No';
  }

  currencyValue(
    path: string
  ): string {
    const rawValue =
      this.offerForm.get(
        path
      )?.value;

    if (
      rawValue === null ||
      rawValue === undefined ||
      rawValue === ''
    ) {
      return 'Not provided';
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      return 'Not provided';
    }

    return this.currencyFormatter
      .format(value);
  }

  dateValue(
    path: string
  ): string {
    const value =
      this.value(path);

    if (!value) {
      return 'Not provided';
    }

    const date =
      new Date(
        `${value}T00:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }
    ).format(date);
  }

  private disclosureStatusLabel(
    path: string
  ): string {
    switch (this.value(path)) {
      case 'received':
        return 'Received before making this offer';

      case 'not_received':
        return 'Not received before making this offer';

      case 'exempt':
        return 'Sale marked exempt';

      default:
        return 'Not selected';
    }
  }

  private hasText(
    path: string
  ): boolean {
    return this.value(path)
      .trim()
      .length > 0;
  }
}
