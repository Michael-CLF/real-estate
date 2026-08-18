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

interface AffordabilityResult {
  estimatedHomePrice: number;
  estimatedLoanAmount: number;
  maximumMonthlyHousingPayment: number;
  estimatedPrincipalAndInterest: number;
  estimatedPropertyTaxes: number;
  estimatedHomeownersInsurance: number;
  monthlyHoa: number;
  frontEndHousingLimit: number;
  backEndHousingLimit: number;
  monthlyGrossIncome: number;
  estimatedFrontEndRatio: number;
  estimatedBackEndRatio: number;
}

@Component({
  selector:
    'app-affordability-calculator',

  standalone: true,

  imports: [
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './affordability-calculator.component.html',

  styleUrl:
    './affordability-calculator.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class AffordabilityCalculatorComponent
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  protected readonly result =
    signal<AffordabilityResult | null>(
      null
    );

  protected readonly calculatorForm =
    this.formBuilder.nonNullable.group({
      annualGrossIncome: [
        120000,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      monthlyDebtPayments: [
        750,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      downPayment: [
        60000,
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

      annualPropertyTaxRate: [
        1.1,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(10)
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

      frontEndRatio: [
        28,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(100)
        ]
      ],

      backEndRatio: [
        36,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(100)
        ]
      ]
    });

  ngOnInit(): void {
    this.calculateAffordability();
  }

  protected calculateAffordability(): void {
    if (this.calculatorForm.invalid) {
      this.calculatorForm.markAllAsTouched();
      this.result.set(null);

      return;
    }

    const values =
      this.calculatorForm.getRawValue();

    const annualGrossIncome =
      this.toFiniteNumber(
        values.annualGrossIncome
      );

    const monthlyDebtPayments =
      this.toFiniteNumber(
        values.monthlyDebtPayments
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

    const annualPropertyTaxRate =
      this.toFiniteNumber(
        values.annualPropertyTaxRate
      );

    const annualHomeownersInsurance =
      this.toFiniteNumber(
        values.annualHomeownersInsurance
      );

    const monthlyHoa =
      this.toFiniteNumber(
        values.monthlyHoa
      );

    const frontEndRatio =
      this.toFiniteNumber(
        values.frontEndRatio
      );

    const backEndRatio =
      this.toFiniteNumber(
        values.backEndRatio
      );

    const monthlyGrossIncome =
      annualGrossIncome / 12;

    const frontEndHousingLimit =
      monthlyGrossIncome *
      (
        frontEndRatio / 100
      );

    const backEndHousingLimit =
      Math.max(
        monthlyGrossIncome *
        (
          backEndRatio / 100
        ) -
        monthlyDebtPayments,
        0
      );

    const maximumMonthlyHousingPayment =
      Math.max(
        Math.min(
          frontEndHousingLimit,
          backEndHousingLimit
        ),
        0
      );

    const monthlyHomeownersInsurance =
      annualHomeownersInsurance / 12;

    const numberOfPayments =
      Math.round(
        loanTermYears * 12
      );

    const monthlyInterestRate =
      interestRate / 100 / 12;

    /*
     * Property taxes depend on the estimated purchase
     * price, while the purchase price depends on the
     * affordable loan amount. Iteration resolves that
     * circular relationship without using a fixed
     * property-tax dollar estimate.
     */
    let estimatedHomePrice =
      downPayment;

    let estimatedLoanAmount = 0;
    let estimatedPropertyTaxes = 0;
    let estimatedPrincipalAndInterest = 0;

    for (
      let iteration = 0;
      iteration < 25;
      iteration += 1
    ) {
      estimatedPropertyTaxes =
        estimatedHomePrice *
        (
          annualPropertyTaxRate / 100
        ) /
        12;

      const availablePrincipalAndInterest =
        Math.max(
          maximumMonthlyHousingPayment -
          estimatedPropertyTaxes -
          monthlyHomeownersInsurance -
          monthlyHoa,
          0
        );

      estimatedLoanAmount =
        this.calculateLoanAmount(
          availablePrincipalAndInterest,
          monthlyInterestRate,
          numberOfPayments
        );

      estimatedHomePrice =
        estimatedLoanAmount +
        downPayment;

      estimatedPrincipalAndInterest =
        availablePrincipalAndInterest;
    }

    estimatedPropertyTaxes =
      estimatedHomePrice *
      (
        annualPropertyTaxRate / 100
      ) /
      12;

    estimatedPrincipalAndInterest =
      Math.max(
        maximumMonthlyHousingPayment -
        estimatedPropertyTaxes -
        monthlyHomeownersInsurance -
        monthlyHoa,
        0
      );

    estimatedLoanAmount =
      this.calculateLoanAmount(
        estimatedPrincipalAndInterest,
        monthlyInterestRate,
        numberOfPayments
      );

    estimatedHomePrice =
      estimatedLoanAmount +
      downPayment;

    const estimatedFrontEndRatio =
      monthlyGrossIncome > 0
        ? (
            maximumMonthlyHousingPayment /
            monthlyGrossIncome
          ) * 100
        : 0;

    const estimatedBackEndRatio =
      monthlyGrossIncome > 0
        ? (
            (
              maximumMonthlyHousingPayment +
              monthlyDebtPayments
            ) /
            monthlyGrossIncome
          ) * 100
        : 0;

    this.result.set({
      estimatedHomePrice:
        this.roundCurrency(
          estimatedHomePrice
        ),

      estimatedLoanAmount:
        this.roundCurrency(
          estimatedLoanAmount
        ),

      maximumMonthlyHousingPayment:
        this.roundCurrency(
          maximumMonthlyHousingPayment
        ),

      estimatedPrincipalAndInterest:
        this.roundCurrency(
          estimatedPrincipalAndInterest
        ),

      estimatedPropertyTaxes:
        this.roundCurrency(
          estimatedPropertyTaxes
        ),

      estimatedHomeownersInsurance:
        this.roundCurrency(
          monthlyHomeownersInsurance
        ),

      monthlyHoa:
        this.roundCurrency(
          monthlyHoa
        ),

      frontEndHousingLimit:
        this.roundCurrency(
          frontEndHousingLimit
        ),

      backEndHousingLimit:
        this.roundCurrency(
          backEndHousingLimit
        ),

      monthlyGrossIncome:
        this.roundCurrency(
          monthlyGrossIncome
        ),

      estimatedFrontEndRatio:
        this.roundPercentage(
          estimatedFrontEndRatio
        ),

      estimatedBackEndRatio:
        this.roundPercentage(
          estimatedBackEndRatio
        )
    });
  }

  protected resetCalculator(): void {
    this.calculatorForm.reset({
      annualGrossIncome: 120000,
      monthlyDebtPayments: 750,
      downPayment: 60000,
      interestRate: 6.5,
      loanTermYears: 30,
      annualPropertyTaxRate: 1.1,
      annualHomeownersInsurance: 1800,
      monthlyHoa: 0,
      frontEndRatio: 28,
      backEndRatio: 36
    });

    this.calculateAffordability();
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
      return 'Enter a value within the permitted range.';
    }

    if (control.hasError('max')) {
      return 'Enter a value within the permitted range.';
    }

    return 'Enter a valid value.';
  }

  private calculateLoanAmount(
    monthlyPayment: number,
    monthlyInterestRate: number,
    numberOfPayments: number
  ): number {
    if (
      monthlyPayment <= 0 ||
      numberOfPayments <= 0
    ) {
      return 0;
    }

    if (monthlyInterestRate === 0) {
      return (
        monthlyPayment *
        numberOfPayments
      );
    }

    const paymentFactor =
      Math.pow(
        1 + monthlyInterestRate,
        numberOfPayments
      );

    return (
      monthlyPayment *
      (
        paymentFactor - 1
      )
    ) /
    (
      monthlyInterestRate *
      paymentFactor
    );
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

  private roundPercentage(
    value: number
  ): number {
    return Math.round(
      value * 100
    ) / 100;
  }
}