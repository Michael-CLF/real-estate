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

interface BalloonCalculationResult {
  loanAmount: number;
  principalAndInterestPayment: number;
  totalMonthlyHousingPayment: number;
  monthlyPropertyTaxes: number;
  monthlyHomeownersInsurance: number;
  monthlyHoa: number;
  balloonBalance: number;
  principalPaidBeforeBalloon: number;
  interestPaidBeforeBalloon: number;
  scheduledPaymentsBeforeBalloon: number;
  totalCashPaidBeforeBalloon: number;
  totalIncludingBalloon: number;
}

@Component({
  selector:
    'app-balloon-payment-calculator',

  standalone: true,

  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './balloon-payment-calculator.component.html',

  styleUrl:
    './balloon-payment-calculator.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class BalloonPaymentCalculatorComponent
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  protected readonly result =
    signal<
      BalloonCalculationResult |
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

      amortizationTermYears: [
        30,
        [
          Validators.required,
          Validators.min(2),
          Validators.max(50)
        ]
      ],

      balloonDueYears: [
        7,
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
    this.formatAllDisplayFields();
    this.calculateBalloonPayment();
  }

  protected calculateBalloonPayment(): void {
    this.formatAllDisplayFields();
    this.clearBalloonRelationshipError();

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

    const amortizationTermYears =
      this.toFiniteNumber(
        values.amortizationTermYears
      );

    const balloonDueYears =
      this.toFiniteNumber(
        values.balloonDueYears
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
      balloonDueYears >=
      amortizationTermYears
    ) {
      this.calculatorForm.controls
        .balloonDueYears
        .setErrors({
          exceedsAmortizationTerm: true
        });

      this.calculatorForm.controls
        .balloonDueYears
        .markAsTouched();

      this.result.set(null);

      return;
    }

    const monthlyInterestRate =
      interestRate / 100 / 12;

    const amortizationMonths =
      Math.round(
        amortizationTermYears * 12
      );

    const scheduledPaymentsBeforeBalloon =
      Math.round(
        balloonDueYears * 12
      );

    const principalAndInterestPayment =
      this.calculateMonthlyPayment(
        loanAmount,
        monthlyInterestRate,
        amortizationMonths
      );

    const balloonBalance =
      this.calculateRemainingBalance(
        loanAmount,
        principalAndInterestPayment,
        monthlyInterestRate,
        scheduledPaymentsBeforeBalloon
      );

    const totalPrincipalAndInterestPayments =
      principalAndInterestPayment *
      scheduledPaymentsBeforeBalloon;

    const principalPaidBeforeBalloon =
      Math.max(
        loanAmount -
        balloonBalance,
        0
      );

    const interestPaidBeforeBalloon =
      Math.max(
        totalPrincipalAndInterestPayments -
        principalPaidBeforeBalloon,
        0
      );

    const monthlyPropertyTaxes =
      annualPropertyTaxes / 12;

    const monthlyHomeownersInsurance =
      annualHomeownersInsurance / 12;

    const totalMonthlyHousingPayment =
      principalAndInterestPayment +
      monthlyPropertyTaxes +
      monthlyHomeownersInsurance +
      monthlyHoa;

    const totalCashPaidBeforeBalloon =
      totalMonthlyHousingPayment *
      scheduledPaymentsBeforeBalloon;

    const totalIncludingBalloon =
      totalCashPaidBeforeBalloon +
      balloonBalance;

    this.result.set({
      loanAmount:
        this.roundCurrency(
          loanAmount
        ),

      principalAndInterestPayment:
        this.roundCurrency(
          principalAndInterestPayment
        ),

      totalMonthlyHousingPayment:
        this.roundCurrency(
          totalMonthlyHousingPayment
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

      balloonBalance:
        this.roundCurrency(
          balloonBalance
        ),

      principalPaidBeforeBalloon:
        this.roundCurrency(
          principalPaidBeforeBalloon
        ),

      interestPaidBeforeBalloon:
        this.roundCurrency(
          interestPaidBeforeBalloon
        ),

      scheduledPaymentsBeforeBalloon,

      totalCashPaidBeforeBalloon:
        this.roundCurrency(
          totalCashPaidBeforeBalloon
        ),

      totalIncludingBalloon:
        this.roundCurrency(
          totalIncludingBalloon
        )
    });
  }

  protected resetCalculator(): void {
    this.calculatorForm.reset({
      loanAmount: '350,000.00',
      interestRate: '6.5',
      amortizationTermYears: 30,
      balloonDueYears: 7,
      annualPropertyTaxes: 4800,
      annualHomeownersInsurance: 1800,
      monthlyHoa: 0
    });

    this.formatAllDisplayFields();
    this.calculateBalloonPayment();
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
        'exceedsAmortizationTerm'
      )
    ) {
      return 'The balloon due date must be earlier than the amortization term.';
    }

    if (control.hasError('min')) {
      return 'Enter a value within the permitted range.';
    }

    if (control.hasError('max')) {
      return 'Enter a value within the permitted range.';
    }

    return 'Enter a valid value.';
  }

  private calculateMonthlyPayment(
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

  private calculateRemainingBalance(
    principal: number,
    monthlyPayment: number,
    monthlyInterestRate: number,
    paymentsMade: number
  ): number {
    if (paymentsMade <= 0) {
      return principal;
    }

    if (monthlyInterestRate === 0) {
      return Math.max(
        principal -
        (
          monthlyPayment *
          paymentsMade
        ),
        0
      );
    }

    const paymentFactor =
      Math.pow(
        1 + monthlyInterestRate,
        paymentsMade
      );

    const remainingBalance =
      principal *
      paymentFactor -
      monthlyPayment *
      (
        (
          paymentFactor - 1
        ) /
        monthlyInterestRate
      );

    return Math.max(
      remainingBalance,
      0
    );
  }

  private clearBalloonRelationshipError(): void {
    const control =
      this.calculatorForm.controls
        .balloonDueYears;

    if (
      !control.hasError(
        'exceedsAmortizationTerm'
      )
    ) {
      return;
    }

    const remainingErrors = {
      ...control.errors
    };

    delete remainingErrors[
      'exceedsAmortizationTerm'
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