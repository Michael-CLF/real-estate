import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CurrencyPipe,
  DecimalPipe
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

interface LoanToValueResult {
  purchasePrice: number;
  appraisedValue: number;
  calculationValue: number;
  firstMortgageAmount: number;
  subordinateFinancingAmount: number;
  totalFinancingAmount: number;
  buyerEquity: number;
  firstMortgageLtv: number;
  combinedLtv: number;
  equityPercentage: number;
}

@Component({
  selector:
    'app-loan-to-value-calculator',

  standalone: true,

  imports: [
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './loan-to-value-calculator.component.html',

  styleUrl:
    './loan-to-value-calculator.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})

export class LoanToValueCalculatorComponent
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  protected readonly result =
    signal<LoanToValueResult | null>(
      null
    );

  protected readonly calculatorForm =
    this.formBuilder.nonNullable.group({
      purchasePrice: [
        '400,000.00',
        [
          Validators.required
        ]
      ],

      appraisedValue: [
        '410,000.00',
        [
          Validators.required
        ]
      ],

      firstMortgageAmount: [
        '320,000.00',
        [
          Validators.required
        ]
      ],

      subordinateFinancingAmount: [
        '0.00',
        [
          Validators.required
        ]
      ]
    });

  ngOnInit(): void {
    this.formatAllDisplayFields();
    this.calculateLoanToValue();
  }

  protected calculateLoanToValue(): void {
    this.formatAllDisplayFields();
    this.clearFinancingError();

    if (this.calculatorForm.invalid) {
      this.calculatorForm.markAllAsTouched();
      this.result.set(null);

      return;
    }

    const values =
      this.calculatorForm.getRawValue();

    const purchasePrice =
      this.toFiniteNumber(
        values.purchasePrice
      );

    const appraisedValue =
      this.toFiniteNumber(
        values.appraisedValue
      );

    const firstMortgageAmount =
      this.toFiniteNumber(
        values.firstMortgageAmount
      );

    const subordinateFinancingAmount =
      this.toFiniteNumber(
        values.subordinateFinancingAmount
      );

    /*
     * For this purchase calculator, the lower of the
     * purchase price or appraised value is used as the
     * calculation value. Actual lender requirements may
     * differ depending on the transaction and loan program.
     */
    const calculationValue =
      Math.min(
        purchasePrice,
        appraisedValue
      );

    const totalFinancingAmount =
      firstMortgageAmount +
      subordinateFinancingAmount;

    if (
      totalFinancingAmount >
      calculationValue
    ) {
      this.calculatorForm.controls
        .firstMortgageAmount
        .setErrors({
          financingExceedsValue: true
        });

      this.calculatorForm.controls
        .firstMortgageAmount
        .markAsTouched();

      this.result.set(null);

      return;
    }

    const firstMortgageLtv =
      calculationValue > 0
        ? (
          firstMortgageAmount /
          calculationValue
        ) * 100
        : 0;

    const combinedLtv =
      calculationValue > 0
        ? (
          totalFinancingAmount /
          calculationValue
        ) * 100
        : 0;

    const buyerEquity =
      Math.max(
        calculationValue -
        totalFinancingAmount,
        0
      );

    const equityPercentage =
      calculationValue > 0
        ? (
          buyerEquity /
          calculationValue
        ) * 100
        : 0;

    this.result.set({
      purchasePrice:
        this.roundCurrency(
          purchasePrice
        ),

      appraisedValue:
        this.roundCurrency(
          appraisedValue
        ),

      calculationValue:
        this.roundCurrency(
          calculationValue
        ),

      firstMortgageAmount:
        this.roundCurrency(
          firstMortgageAmount
        ),

      subordinateFinancingAmount:
        this.roundCurrency(
          subordinateFinancingAmount
        ),

      totalFinancingAmount:
        this.roundCurrency(
          totalFinancingAmount
        ),

      buyerEquity:
        this.roundCurrency(
          buyerEquity
        ),

      firstMortgageLtv:
        this.roundPercentage(
          firstMortgageLtv
        ),

      combinedLtv:
        this.roundPercentage(
          combinedLtv
        ),

      equityPercentage:
        this.roundPercentage(
          equityPercentage
        )
    });
  }

  protected resetCalculator(): void {
    this.calculatorForm.reset({
      purchasePrice: '400,000.00',
      appraisedValue: '410,000.00',
      firstMortgageAmount: '320,000.00',
      subordinateFinancingAmount: '0.00'
    });

    this.formatAllDisplayFields();
    this.calculateLoanToValue();
  }
  protected isInvalid(
    controlName:
      keyof typeof this.calculatorForm.controls
  ): boolean {
    const control =
      this.calculatorForm.controls[
      controlName
      ];

    return (
      control.invalid &&
      (
        control.touched ||
        control.dirty
      )
    );
  }

  protected errorMessage(
    controlName:
      keyof typeof this.calculatorForm.controls
  ): string {
    const control =
      this.calculatorForm.controls[
      controlName
      ];

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (
      control.hasError(
        'financingExceedsValue'
      )
    ) {
      return 'Total financing cannot exceed the value used by this calculator.';
    }

    if (control.hasError('min')) {
      return 'Enter a value greater than or equal to zero.';
    }

    return 'Enter a valid value.';
  }

  private clearFinancingError(): void {
    const control =
      this.calculatorForm.controls
        .firstMortgageAmount;

    if (
      !control.hasError(
        'financingExceedsValue'
      )
    ) {
      return;
    }

    const remainingErrors = {
      ...control.errors
    };

    delete remainingErrors[
      'financingExceedsValue'
    ];

    control.setErrors(
      Object.keys(
        remainingErrors
      ).length > 0
        ? remainingErrors
        : null
    );
  }

  private formatAllDisplayFields(): void {
    this.formatCurrencyField(
      'purchasePrice'
    );

    this.formatCurrencyField(
      'appraisedValue'
    );

    this.formatCurrencyField(
      'firstMortgageAmount'
    );

    this.formatCurrencyField(
      'subordinateFinancingAmount'
    );
  }

  protected formatCurrencyField(
    controlName:
      | 'purchasePrice'
      | 'appraisedValue'
      | 'firstMortgageAmount'
      | 'subordinateFinancingAmount'
  ): void {
    const control =
      this.calculatorForm.controls[
      controlName
      ];

    const numericValue =
      this.toFiniteNumber(control.value);

    control.setValue(
      numericValue.toLocaleString(
        'en-US',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: true
        }
      ),
      {
        emitEvent: false
      }
    );
  }

  protected prepareNumericInput(
    event: FocusEvent
  ): void {
    const input =
      event.target as HTMLInputElement;

    input.select();
  }

  private toFiniteNumber(
    value: string | number
  ): number {
    const normalizedValue =
      typeof value === 'string'
        ? value.replace(
          /[$,%\s]/g,
          ''
        )
        : value;

    const convertedValue =
      Number(normalizedValue);

    return Number.isFinite(
      convertedValue
    )
      ? convertedValue
      : 0;
  }

  private roundCurrency(
    value: number
  ): number {
    return Math.round(
      value * 100
    ) / 100;
  }

  private roundPercentage(
    value: number
  ): number {
    return Math.round(
      value * 100
    ) / 100;
  }
}