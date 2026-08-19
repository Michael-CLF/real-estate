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

interface AmortizationResult {
  months: number;
  totalInterest: number;
  totalPaid: number;
}

interface ExtraPaymentResult {
  loanAmount: number;
  regularMonthlyPayment: number;
  extraMonthlyPayment: number;
  annualExtraPayment: number;
  originalMonths: number;
  acceleratedMonths: number;
  originalInterest: number;
  acceleratedInterest: number;
  interestSavings: number;
  monthsSaved: number;
  totalExtraPayments: number;
  acceleratedTotalPaid: number;
}

@Component({
  selector: 'app-extra-payment-calculator',

  standalone: true,

  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './extra-payment-calculator.component.html',

  styleUrl:
    './extra-payment-calculator.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ExtraPaymentCalculatorComponent
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  protected readonly result =
    signal<ExtraPaymentResult | null>(null);

  protected readonly calculatorForm =
    this.formBuilder.nonNullable.group({
      loanAmount: [
        '320,000.00',
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

      loanTermYears: [
        30,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(50)
        ]
      ],

      extraMonthlyPayment: [
        '200.00',
        [
          Validators.required
        ]
      ],

      annualExtraPayment: [
        '0.00',
        [
          Validators.required
        ]
      ]
    });

  ngOnInit(): void {
    this.formatAllDisplayFields();
    this.calculateExtraPayments();
  }

  protected calculateExtraPayments(): void {
    if (this.calculatorForm.invalid) {
      this.calculatorForm.markAllAsTouched();
      this.result.set(null);

      return;
    }

    const values =
      this.calculatorForm.getRawValue();

    const loanAmount =
      this.toFiniteNumber(values.loanAmount);

    const annualInterestRate =
      this.toFiniteNumber(values.interestRate);

    const loanTermYears =
      this.toFiniteNumber(values.loanTermYears);

    const extraMonthlyPayment =
      this.toFiniteNumber(
        values.extraMonthlyPayment
      );

    const annualExtraPayment =
      this.toFiniteNumber(
        values.annualExtraPayment
      );

    const originalMonths =
      Math.round(loanTermYears * 12);

    const monthlyRate =
      annualInterestRate / 100 / 12;

    const regularMonthlyPayment =
      this.calculateMonthlyPayment(
        loanAmount,
        monthlyRate,
        originalMonths
      );

    const originalSchedule =
      this.simulateLoan(
        loanAmount,
        monthlyRate,
        regularMonthlyPayment,
        0,
        0,
        originalMonths
      );

    const acceleratedSchedule =
      this.simulateLoan(
        loanAmount,
        monthlyRate,
        regularMonthlyPayment,
        extraMonthlyPayment,
        annualExtraPayment,
        originalMonths
      );

    const monthsSaved =
      Math.max(
        originalSchedule.months -
        acceleratedSchedule.months,
        0
      );

    const interestSavings =
      Math.max(
        originalSchedule.totalInterest -
        acceleratedSchedule.totalInterest,
        0
      );

    const totalExtraPayments =
      Math.max(
        acceleratedSchedule.totalPaid -
        (
          regularMonthlyPayment *
          acceleratedSchedule.months
        ),
        0
      );

    this.result.set({
      loanAmount:
        this.roundCurrency(loanAmount),

      regularMonthlyPayment:
        this.roundCurrency(
          regularMonthlyPayment
        ),

      extraMonthlyPayment:
        this.roundCurrency(
          extraMonthlyPayment
        ),

      annualExtraPayment:
        this.roundCurrency(
          annualExtraPayment
        ),

      originalMonths:
        originalSchedule.months,

      acceleratedMonths:
        acceleratedSchedule.months,

      originalInterest:
        this.roundCurrency(
          originalSchedule.totalInterest
        ),

      acceleratedInterest:
        this.roundCurrency(
          acceleratedSchedule.totalInterest
        ),

      interestSavings:
        this.roundCurrency(interestSavings),

      monthsSaved,

      totalExtraPayments:
        this.roundCurrency(
          totalExtraPayments
        ),

      acceleratedTotalPaid:
        this.roundCurrency(
          acceleratedSchedule.totalPaid
        )
    });
  }

  protected resetCalculator(): void {
    this.calculatorForm.reset({
      loanAmount: '320,000.00',
      interestRate: '6.5',
      loanTermYears: 30,
      extraMonthlyPayment: '200.00',
      annualExtraPayment: '0.00'
    });

    this.formatAllDisplayFields();
    this.calculateExtraPayments();
  }

  protected isInvalid(
    controlName:
      keyof typeof this.calculatorForm.controls
  ): boolean {
    const control =
      this.calculatorForm.controls[controlName];

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
      this.calculatorForm.controls[controlName];

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('min')) {
      return 'Enter a value greater than or equal to zero.';
    }

    if (control.hasError('max')) {
      return 'Enter a value within the allowed range.';
    }

    return 'Enter a valid value.';
  }

  protected formatTerm(months: number): string {
    const years =
      Math.floor(months / 12);

    const remainingMonths =
      months % 12;

    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1
        ? 'month'
        : 'months'
        }`;
    }

    if (remainingMonths === 0) {
      return `${years} ${years === 1
        ? 'year'
        : 'years'
        }`;
    }

    return `${years} ${years === 1
      ? 'year'
      : 'years'
      }, ${remainingMonths} ${remainingMonths === 1
        ? 'month'
        : 'months'
      }`;
  }

  private calculateMonthlyPayment(
    principal: number,
    monthlyRate: number,
    numberOfPayments: number
  ): number {
    if (monthlyRate === 0) {
      return principal / numberOfPayments;
    }

    const growthFactor =
      Math.pow(
        1 + monthlyRate,
        numberOfPayments
      );

    return (
      principal *
      (
        monthlyRate *
        growthFactor
      )
    ) /
      (
        growthFactor - 1
      );
  }

  private simulateLoan(
    principal: number,
    monthlyRate: number,
    regularPayment: number,
    extraMonthlyPayment: number,
    annualExtraPayment: number,
    originalMonths: number
  ): AmortizationResult {
    let balance = principal;
    let totalInterest = 0;
    let totalPaid = 0;
    let month = 0;

    const maximumMonths =
      Math.max(originalMonths * 2, 1200);

    while (
      balance > 0.005 &&
      month < maximumMonths
    ) {
      month++;

      const monthlyInterest =
        balance * monthlyRate;

      totalInterest += monthlyInterest;

      let scheduledPayment =
        regularPayment +
        extraMonthlyPayment;

      if (
        annualExtraPayment > 0 &&
        month % 12 === 0
      ) {
        scheduledPayment +=
          annualExtraPayment;
      }

      const amountDue =
        balance + monthlyInterest;

      const actualPayment =
        Math.min(
          scheduledPayment,
          amountDue
        );

      balance =
        Math.max(
          amountDue - actualPayment,
          0
        );

      totalPaid += actualPayment;
    }

    return {
      months: month,
      totalInterest,
      totalPaid
    };
  }

  private formatAllDisplayFields(): void {
    this.formatCurrencyField(
      'loanAmount'
    );

    this.formatInterestRate();

    this.formatCurrencyField(
      'extraMonthlyPayment'
    );

    this.formatCurrencyField(
      'annualExtraPayment'
    );
  }

  protected formatCurrencyField(
    controlName:
      | 'loanAmount'
      | 'extraMonthlyPayment'
      | 'annualExtraPayment'
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
    return (
      Math.round(value * 100) / 100
    );
  }
}