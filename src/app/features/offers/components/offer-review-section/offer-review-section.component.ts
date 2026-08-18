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
        maximumFractionDigits: 0
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

  get financingMethodLabel():
    string {
    switch (
    this.value(
      'priceFinancing.financingMethod'
    )
    ) {
      case 'cash':
        return 'Cash purchase';

      case 'financing':
        return 'Financing';

      case 'cash_and_financing':
        return 'Cash and financing';

      default:
        return 'Not selected';
    }
  }

  get loanTypeLabel(): string {
    const loanType =
      this.value(
        'priceFinancing.loanType'
      );

    const labels:
      Record<string, string> = {
      conventional:
        'Conventional',

      fha:
        'FHA',

      va:
        'VA',

      usda:
        'USDA',

      jumbo:
        'Jumbo',

      other:
        this.value(
          'priceFinancing.otherLoanType'
        ) || 'Other'
    };

    return labels[loanType] ??
      'Not applicable';
  }

  get selectedConditions():
    string[] {
    const conditions:
      string[] = [];

    if (
      this.booleanValue(
        'investigations.inspectionIntended'
      )
    ) {
      conditions.push(
        'Property inspections intended'
      );
    }

    if (
      this.booleanValue(
        'investigations.appraisalContingencyRequested'
      )
    ) {
      conditions.push(
        'Appraisal condition requested'
      );
    }

    if (
      this.booleanValue(
        'investigations.financingContingencyRequested'
      )
    ) {
      conditions.push(
        'Financing condition requested'
      );
    }

    if (
      this.booleanValue(
        'investigations.saleOfExistingHomeRequired'
      )
    ) {
      conditions.push(
        'Sale of existing home required'
      );
    }

    return conditions;
  }

  get selectedInclusions():
    string[] {
    const inclusions:
      Array<{
        path: string;
        label: string;
      }> = [
        {
          path:
            'propertyInclusions.builtInAppliancesIncluded',

          label:
            'Built-in appliances'
        },

        {
          path:
            'propertyInclusions.refrigeratorIncluded',

          label:
            'Refrigerator'
        },

        {
          path:
            'propertyInclusions.washerIncluded',

          label:
            'Clothes washer'
        },

        {
          path:
            'propertyInclusions.dryerIncluded',

          label:
            'Clothes dryer'
        },

        {
          path:
            'propertyInclusions.windowTreatmentsIncluded',

          label:
            'Window treatments'
        },

        {
          path:
            'propertyInclusions.securitySystemsIncluded',

          label:
            'Security equipment'
        },

        {
          path:
            'propertyInclusions.fuelOrPropaneIncluded',

          label:
            'Fuel or propane'
        }
      ];

    return inclusions
      .filter(
        inclusion =>
          this.booleanValue(
            inclusion.path
          )
      )
      .map(
        inclusion =>
          inclusion.label
      );
  }

  get hasAttorneyBlocker():
    boolean {
    const attorneyRequired =
      this.booleanValue(
        'additionalTerms.attorneyDraftedLanguageRequired'
      );

    const attorneyStatus =
      this.value(
        'additionalTerms.attorneyReviewStatus'
      );

    return (
      attorneyRequired &&
      attorneyStatus !== 'completed'
    );
  }

  get allPriorSectionsValid():
    boolean {
    const sectionNames = [
      'buyerProperty',
      'priceFinancing',
      'depositsDueDiligence',
      'investigations',
      'concessions',
      'propertyInclusions',
      'settlementPossession',
      'disclosuresAddenda',
      'additionalTerms',
      'offerExpiration'
    ];

    return sectionNames.every(
      sectionName =>
        this.offerForm
          .get(sectionName)
          ?.valid === true
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

  currencyValue(
    path: string
  ): string {
    const value =
      Number(
        this.offerForm.get(
          path
        )?.value
      );

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

  yesNoValue(
    path: string
  ): string {
    return this.booleanValue(path)
      ? 'Yes'
      : 'No';
  }
}