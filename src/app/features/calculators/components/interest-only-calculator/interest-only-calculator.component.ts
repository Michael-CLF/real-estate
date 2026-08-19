import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CurrencyPipe
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

interface InterestOnlyCalculationResult {
  loanAmount: number;
  interestOnlyPayment: number;
  interestOnlyTotalPayment: number;
  postInterestOnlyPayment: number;
  postInterestOnlyTotalPayment: number;
  monthlyPropertyTaxes: number;
  monthlyHomeownersInsurance: number;
  monthlyHoa: number;
  interestPaidDuringInterestOnlyPeriod: number;
  remainingPrincipalBalance: number;
  interestOnlyMonths: number;
  amortizationMonths: number;
}

@Component({
  selector:
    'app-interest-only-calculator',

  standalone: true,

  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './interest-only-calculator.component.html',

  styleUrl:
    './interest-only-calculator.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class InterestOnlyCalculatorComponent
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  protected readonly result =
    signal<
      InterestOnlyCalculationResult |
      null
    >(null);

  protected readonly calculatorForm =
    this.formBuilder.nonNullable.group({
      loanAmount: [
        '350,000.00',
        [
          Validators.required
        ]
      ],

      interestRate: [
        '6.5',
        [
          Validators.required
        ]
      ],

      totalLoanTermYears: [
        30,
        [
          Validators.required,
          Validators.min(2),
          Validators.max(50)
        ]
      ],

      interestOnlyPeriodYears: [
        10,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(49)
        ]
      ],

      annualPropertyTaxes: [
        4800,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      annualHomeownersInsurance: [
        1800,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      monthlyHoa: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ]
    });

  ngOnInit(): void {
    this.calculatePayment();
    this.formatAllDisplayFields();    
  }

  protected calculatePayment(): void {
    this.clearPeriodRelationshipError();
    this.formatAllDisplayFields();

    if (this.calculatorForm.invalid) {
      this.calculatorForm.markAllAsTouched();
      this.result.set(null);

      return;
    }

    const values =
      this.calculatorForm.getRawValue();

    const loanAmount =
      this.toFiniteNumber(
        values.loanAmount
      );

    const interestRate =
      this.toFiniteNumber(
        values.interestRate
      );

    const totalLoanTermYears =
      this.toFiniteNumber(
        values.totalLoanTermYears
      );

    const interestOnlyPeriodYears =
      this.toFiniteNumber(
        values.interestOnlyPeriodYears
      );

    const annualPropertyTaxes =
      this.toFiniteNumber(
        values.annualPropertyTaxes
      );

    const annualHomeownersInsurance =
      this.toFiniteNumber(
        values.annualHomeownersInsurance
      );

    const monthlyHoa =
      this.toFiniteNumber(
        values.monthlyHoa
      );

    if (
      interestOnlyPeriodYears >=
      totalLoanTermYears
    ) {
      this.calculatorForm.controls
        .interestOnlyPeriodYears
        .setErrors({
          exceedsLoanTerm: true
        });

      this.calculatorForm.controls
        .interestOnlyPeriodYears
        .markAsTouched();

      this.result.set(null);

      return;
    }

    const monthlyInterestRate =
      interestRate / 100 / 12;

    const interestOnlyMonths =
      Math.round(
        interestOnlyPeriodYears * 12
      );

    const totalLoanTermMonths =
      Math.round(
        totalLoanTermYears * 12
      );

    const amortizationMonths =
      totalLoanTermMonths -
      interestOnlyMonths;

    const interestOnlyPayment =
      loanAmount *
      monthlyInterestRate;

    const postInterestOnlyPayment =
      this.calculateAmortizingPayment(
        loanAmount,
        monthlyInterestRate,
        amortizationMonths
      );

    const monthlyPropertyTaxes =
      annualPropertyTaxes / 12;

    const monthlyHomeownersInsurance =
      annualHomeownersInsurance / 12;

    const monthlyExpenses =
      monthlyPropertyTaxes +
      monthlyHomeownersInsurance +
      monthlyHoa;

    const interestOnlyTotalPayment =
      interestOnlyPayment +
      monthlyExpenses;

    const postInterestOnlyTotalPayment =
      postInterestOnlyPayment +
      monthlyExpenses;

    const interestPaidDuringInterestOnlyPeriod =
      interestOnlyPayment *
      interestOnlyMonths;

    /*
     * During a true interest-only period, the scheduled
     * payment does not reduce principal. Therefore, the
     * remaining scheduled principal at the end of the
     * interest-only period is the original loan amount.
     */
    const remainingPrincipalBalance =
      loanAmount;

    this.result.set({
      loanAmount:
        this.roundCurrency(
          loanAmount
        ),

      interestOnlyPayment:
        this.roundCurrency(
          interestOnlyPayment
        ),

      interestOnlyTotalPayment:
        this.roundCurrency(
          interestOnlyTotalPayment
        ),

      postInterestOnlyPayment:
        this.roundCurrency(
          postInterestOnlyPayment
        ),

      postInterestOnlyTotalPayment:
        this.roundCurrency(
          postInterestOnlyTotalPayment
        ),

      monthlyPropertyTaxes:
        this.roundCurrency(
          monthlyPropertyTaxes
        ),

      monthlyHomeownersInsurance:
        this.roundCurrency(
          monthlyHomeownersInsurance
        ),

      monthlyHoa:
        this.roundCurrency(
          monthlyHoa
        ),

      interestPaidDuringInterestOnlyPeriod:
        this.roundCurrency(
          interestPaidDuringInterestOnlyPeriod
        ),

      remainingPrincipalBalance:
        this.roundCurrency(
          remainingPrincipalBalance
        ),

      interestOnlyMonths,

      amortizationMonths
    });
  }

  protected resetCalculator(): void {
    this.calculatorForm.reset({
      loanAmount: '350,000.00',
      interestRate: '6.5',
      totalLoanTermYears: 30,
      interestOnlyPeriodYears: 10,
      annualPropertyTaxes: 4800,
      annualHomeownersInsurance: 1800,
      monthlyHoa: 0
    });

    this.calculatePayment();
    this.formatAllDisplayFields();
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
        'exceedsLoanTerm'
      )
    ) {
      return 'The interest-only period must be shorter than the total loan term.';
    }

    if (control.hasError('min')) {
      return 'Enter a value within the permitted range.';
    }

    if (control.hasError('max')) {
      return 'Enter a value within the permitted range.';
    }

    return 'Enter a valid value.';
  }

  private calculateAmortizingPayment(
    principal: number,
    monthlyInterestRate: number,
    numberOfPayments: number
  ): number {
    if (
      principal <= 0 ||
      numberOfPayments <= 0
    ) {
      return 0;
    }

    if (monthlyInterestRate === 0) {
      return (
        principal /
        numberOfPayments
      );
    }

    const paymentFactor =
      Math.pow(
        1 + monthlyInterestRate,
        numberOfPayments
      );

    return (
      principal *
      (
        monthlyInterestRate *
        paymentFactor
      )
    ) /
      (
        paymentFactor - 1
      );
  }

  private clearPeriodRelationshipError(): void {
    const control =
      this.calculatorForm.controls
        .interestOnlyPeriodYears;

    if (
      !control.hasError(
        'exceedsLoanTerm'
      )
    ) {
      return;
    }

    const remainingErrors = {
      ...control.errors
    };

    delete remainingErrors[
      'exceedsLoanTerm'
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
    'loanAmount'
  );

  this.formatInterestRate();
}

protected formatCurrencyField(
  controlName: 'loanAmount'
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

protected formatInterestRate(): void {
  const control =
    this.calculatorForm.controls
      .interestRate;

  const numericValue =
    this.toFiniteNumber(control.value);

  control.setValue(
    numericValue.toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 1,
        maximumFractionDigits: 3,
        useGrouping: false
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
}