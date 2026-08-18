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

interface MortgageCalculationResult {
  loanAmount: number;
  principalAndInterest: number;
  monthlyPropertyTaxes: number;
  monthlyHomeownersInsurance: number;
  monthlyHoa: number;
  monthlyMortgageInsurance: number;
  totalMonthlyPayment: number;
  totalInterest: number;
  totalPrincipalAndInterest: number;
  downPaymentPercentage: number;
}

@Component({
  selector: 'app-mortgage-payment-calculator',

  standalone: true,

  imports: [
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './mortgage-payment-calculator.component.html',

  styleUrl:
    './mortgage-payment-calculator.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class MortgagePaymentCalculatorComponent
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  protected readonly result =
    signal<MortgageCalculationResult | null>(
      null
    );

  protected readonly calculatorForm =
    this.formBuilder.nonNullable.group({
      purchasePrice: [
        400000,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      downPayment: [
        80000,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      interestRate: [
        6.5,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(100)
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
      ],

      monthlyMortgageInsurance: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ]
    });

  ngOnInit(): void {
    this.calculateMortgage();
  }

  protected calculateMortgage(): void {
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

    const downPayment =
      this.toFiniteNumber(
        values.downPayment
      );

    const interestRate =
      this.toFiniteNumber(
        values.interestRate
      );

    const loanTermYears =
      this.toFiniteNumber(
        values.loanTermYears
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

    const monthlyMortgageInsurance =
      this.toFiniteNumber(
        values.monthlyMortgageInsurance
      );

    if (downPayment > purchasePrice) {
      this.calculatorForm.controls
        .downPayment
        .setErrors({
          exceedsPurchasePrice: true
        });

      this.result.set(null);

      return;
    }

    const loanAmount =
      Math.max(
        purchasePrice - downPayment,
        0
      );

    const numberOfPayments =
      Math.round(
        loanTermYears * 12
      );

    const monthlyInterestRate =
      interestRate / 100 / 12;

    let principalAndInterest = 0;

    if (
      loanAmount > 0 &&
      numberOfPayments > 0
    ) {
      if (monthlyInterestRate === 0) {
        principalAndInterest =
          loanAmount / numberOfPayments;
      } else {
        const paymentFactor =
          Math.pow(
            1 + monthlyInterestRate,
            numberOfPayments
          );

        principalAndInterest =
          loanAmount *
          (
            monthlyInterestRate *
            paymentFactor
          ) /
          (
            paymentFactor - 1
          );
      }
    }

    const monthlyPropertyTaxes =
      annualPropertyTaxes / 12;

    const monthlyHomeownersInsurance =
      annualHomeownersInsurance / 12;

    const totalMonthlyPayment =
      principalAndInterest +
      monthlyPropertyTaxes +
      monthlyHomeownersInsurance +
      monthlyHoa +
      monthlyMortgageInsurance;

    const totalPrincipalAndInterest =
      principalAndInterest *
      numberOfPayments;

    const totalInterest =
      Math.max(
        totalPrincipalAndInterest -
        loanAmount,
        0
      );

    const downPaymentPercentage =
      purchasePrice > 0
        ? (
            downPayment /
            purchasePrice
          ) * 100
        : 0;

    this.result.set({
      loanAmount:
        this.roundCurrency(
          loanAmount
        ),

      principalAndInterest:
        this.roundCurrency(
          principalAndInterest
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

      monthlyMortgageInsurance:
        this.roundCurrency(
          monthlyMortgageInsurance
        ),

      totalMonthlyPayment:
        this.roundCurrency(
          totalMonthlyPayment
        ),

      totalInterest:
        this.roundCurrency(
          totalInterest
        ),

      totalPrincipalAndInterest:
        this.roundCurrency(
          totalPrincipalAndInterest
        ),

      downPaymentPercentage:
        Math.round(
          downPaymentPercentage * 100
        ) / 100
    });
  }

  protected resetCalculator(): void {
    this.calculatorForm.reset({
      purchasePrice: 400000,
      downPayment: 80000,
      interestRate: 6.5,
      loanTermYears: 30,
      annualPropertyTaxes: 4800,
      annualHomeownersInsurance: 1800,
      monthlyHoa: 0,
      monthlyMortgageInsurance: 0
    });

    this.calculateMortgage();
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

    if (control.hasError('min')) {
      return 'Enter a value greater than or equal to zero.';
    }

    if (control.hasError('max')) {
      return 'Enter a value within the permitted range.';
    }

    if (
      control.hasError(
        'exceedsPurchasePrice'
      )
    ) {
      return 'The down payment cannot exceed the purchase price.';
    }

    return 'Enter a valid value.';
  }

  private toFiniteNumber(
    value: number
  ): number {
    const convertedValue =
      Number(value);

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