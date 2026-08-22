import {
  CurrencyPipe,
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  input,
  signal,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  RouterLink,
} from '@angular/router';

import {
  Subscription,
} from 'rxjs';

type CalculatorEditingSection =
  | 'downPayment'
  | 'homePrice'
  | 'loanDetails'
  | 'paymentCosts'
  | null;

interface ListingMortgageCalculatorForm {
  homePrice: FormControl<number>;
  downPaymentAmount: FormControl<number>;
  downPaymentPercent: FormControl<number>;
  interestRate: FormControl<number>;
  loanTermYears: FormControl<number>;
  annualPropertyTax: FormControl<number>;
  annualHomeownersInsurance: FormControl<number>;
  monthlyMortgageInsurance: FormControl<number>;
  monthlyHoaFee: FormControl<number>;
}

interface ListingMortgageCalculation {
  loanAmount: number;
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyHomeownersInsurance: number;
  monthlyMortgageInsurance: number;
  monthlyHoaFee: number;
  estimatedMonthlyPayment: number;
}

@Component({
  selector: 'app-listing-mortgage-calculator',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl:
    './listing-mortgage-calculator.component.html',
  styleUrl:
    './listing-mortgage-calculator.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ListingMortgageCalculatorComponent
  implements OnInit, OnDestroy {
  readonly listingPrice =
    input.required<number>();

  readonly annualPropertyTax =
    input<number | undefined>();

  readonly annualHomeownersInsurance =
    input<number | undefined>();

  readonly monthlyHoaFee =
    input<number | undefined>();

  readonly defaultInterestRate =
    input(6.5);

  readonly editingSection =
    signal<CalculatorEditingSection>(null);

  readonly calculatorForm =
    new FormGroup<ListingMortgageCalculatorForm>({
      homePrice:
        new FormControl(
          0,
          {
            nonNullable: true,
          },
        ),

      downPaymentAmount:
        new FormControl(
          0,
          {
            nonNullable: true,
          },
        ),

      downPaymentPercent:
        new FormControl(
          20,
          {
            nonNullable: true,
          },
        ),

      interestRate:
        new FormControl(
          6.5,
          {
            nonNullable: true,
          },
        ),

      loanTermYears:
        new FormControl(
          30,
          {
            nonNullable: true,
          },
        ),

      annualPropertyTax:
        new FormControl(
          0,
          {
            nonNullable: true,
          },
        ),

      annualHomeownersInsurance:
        new FormControl(
          0,
          {
            nonNullable: true,
          },
        ),

      monthlyMortgageInsurance:
        new FormControl(
          0,
          {
            nonNullable: true,
          },
        ),

      monthlyHoaFee:
        new FormControl(
          0,
          {
            nonNullable: true,
          },
        ),
    });

  private readonly calculationInputs = signal({
    homePrice: 0,
    downPaymentAmount: 0,
    downPaymentPercent: 20,
    interestRate: 6.5,
    loanTermYears: 30,
    annualPropertyTax: 0,
    annualHomeownersInsurance: 0,
    monthlyMortgageInsurance: 0,
    monthlyHoaFee: 0,
  });

  private formSubscription?: Subscription;
  private updatingDownPayment = false;

  readonly showMortgageInsurance =
    computed(
      () =>
        this.calculationInputs()
          .downPaymentPercent < 20,
    );

  readonly calculation =
    computed<ListingMortgageCalculation>(() => {
      const values =
        this.calculationInputs();

      const homePrice =
        this.nonNegative(
          values.homePrice,
        );

      const downPaymentAmount =
        Math.min(
          this.nonNegative(
            values.downPaymentAmount,
          ),
          homePrice,
        );

      const loanAmount =
        Math.max(
          homePrice -
          downPaymentAmount,
          0,
        );

      const annualInterestRate =
        this.nonNegative(
          values.interestRate,
        ) / 100;

      const monthlyInterestRate =
        annualInterestRate / 12;

      const paymentCount =
        Math.max(
          Math.round(
            this.nonNegative(
              values.loanTermYears,
            ) * 12,
          ),
          0,
        );

      const monthlyPrincipalAndInterest =
        this.calculatePrincipalAndInterest(
          loanAmount,
          monthlyInterestRate,
          paymentCount,
        );

      const monthlyPropertyTax =
        this.nonNegative(
          values.annualPropertyTax,
        ) / 12;

      const monthlyHomeownersInsurance =
        this.nonNegative(
          values.annualHomeownersInsurance,
        ) / 12;

      const monthlyMortgageInsurance =
        values.downPaymentPercent < 20
          ? this.nonNegative(
            values.monthlyMortgageInsurance,
          )
          : 0;

      const monthlyHoaFee =
        this.nonNegative(
          values.monthlyHoaFee,
        );

      return {
        loanAmount,

        monthlyPrincipalAndInterest,

        monthlyPropertyTax,

        monthlyHomeownersInsurance,

        monthlyMortgageInsurance,

        monthlyHoaFee,

        estimatedMonthlyPayment:
          monthlyPrincipalAndInterest +
          monthlyPropertyTax +
          monthlyHomeownersInsurance +
          monthlyMortgageInsurance +
          monthlyHoaFee,
      };
    });

  readonly paymentChartBackground =
    computed(() => {
      const calculation =
        this.calculation();

      const total =
        calculation.estimatedMonthlyPayment;

      if (total <= 0) {
        return (
          'conic-gradient(' +
          '#d7e0e5 0deg 360deg' +
          ')'
        );
      }

      const principalEnd =
        this.chartDegrees(
          calculation
            .monthlyPrincipalAndInterest,
          total,
        );

      const taxEnd =
        principalEnd +
        this.chartDegrees(
          calculation.monthlyPropertyTax,
          total,
        );

      const insuranceEnd =
        taxEnd +
        this.chartDegrees(
          calculation
            .monthlyHomeownersInsurance,
          total,
        );

      const mortgageInsuranceEnd =
        insuranceEnd +
        this.chartDegrees(
          calculation
            .monthlyMortgageInsurance,
          total,
        );

      return (
        'conic-gradient(' +
        `#2468d8 0deg ${principalEnd}deg, ` +
        `#8e44ad ${principalEnd}deg ${taxEnd}deg, ` +
        `#168f8b ${taxEnd}deg ${insuranceEnd}deg, ` +
        `#d68910 ${insuranceEnd}deg ${mortgageInsuranceEnd}deg, ` +
        `#d35400 ${mortgageInsuranceEnd}deg 360deg` +
        ')'
      );
    });

  ngOnInit(): void {
    this.initializeCalculator();

    this.formSubscription =
      this.calculatorForm
        .valueChanges
        .subscribe(() => {
          this.updateCalculationInputs();
        });
  }

  ngOnDestroy(): void {
    this.formSubscription
      ?.unsubscribe();
  }

  toggleEditingSection(
    section:
      Exclude<
        CalculatorEditingSection,
        null
      >,
  ): void {
    this.editingSection.update(
      currentSection =>
        currentSection === section
          ? null
          : section,
    );
  }

  isEditing(
    section:
      Exclude<
        CalculatorEditingSection,
        null
      >,
  ): boolean {
    return (
      this.editingSection() ===
      section
    );
  }

  closeEditing(): void {
    this.editingSection.set(null);
  }

  updateDownPaymentFromPercent(): void {
    if (this.updatingDownPayment) {
      return;
    }

    this.updatingDownPayment = true;

    const homePrice =
      this.nonNegative(
        this.calculatorForm.controls
          .homePrice.value,
      );

    const downPaymentPercent =
      this.limitPercentage(
        this.calculatorForm.controls
          .downPaymentPercent.value,
      );

    const downPaymentAmount =
      this.roundCurrency(
        homePrice *
        (
          downPaymentPercent /
          100
        ),
      );

    this.calculatorForm.controls
      .downPaymentPercent
      .setValue(
        downPaymentPercent,
        {
          emitEvent: false,
        },
      );

    this.calculatorForm.controls
      .downPaymentAmount
      .setValue(
        downPaymentAmount,
        {
          emitEvent: false,
        },
      );

    this.updatingDownPayment = false;
    this.updateCalculationInputs();
  }

  updateDownPaymentFromAmount(): void {
    if (this.updatingDownPayment) {
      return;
    }

    this.updatingDownPayment = true;

    const homePrice =
      this.nonNegative(
        this.calculatorForm.controls
          .homePrice.value,
      );

    const downPaymentAmount =
      Math.min(
        this.nonNegative(
          this.calculatorForm.controls
            .downPaymentAmount.value,
        ),
        homePrice,
      );

    const downPaymentPercent =
      homePrice > 0
        ? this.roundPercentage(
          (
            downPaymentAmount /
            homePrice
          ) * 100,
        )
        : 0;

    this.calculatorForm.controls
      .downPaymentAmount
      .setValue(
        downPaymentAmount,
        {
          emitEvent: false,
        },
      );

    this.calculatorForm.controls
      .downPaymentPercent
      .setValue(
        downPaymentPercent,
        {
          emitEvent: false,
        },
      );

    this.updatingDownPayment = false;
    this.updateCalculationInputs();
  }

  updateHomePrice(): void {
    const homePrice =
      this.nonNegative(
        this.calculatorForm.controls
          .homePrice.value,
      );

    this.calculatorForm.controls
      .homePrice
      .setValue(
        homePrice,
        {
          emitEvent: false,
        },
      );

    this.updateDownPaymentFromPercent();
  }

  resetCalculator(): void {
    this.initializeCalculator();
    this.editingSection.set(null);
  }

  private initializeCalculator(): void {
    const homePrice =
      this.nonNegative(
        this.listingPrice(),
      );

    const downPaymentPercent = 20;

    this.calculatorForm.setValue(
      {
        homePrice,

        downPaymentAmount:
          this.roundCurrency(
            homePrice * 0.2,
          ),

        downPaymentPercent,

        interestRate:
          this.nonNegative(
            this.defaultInterestRate(),
          ),

        loanTermYears: 30,

        
                 annualPropertyTax:
          this.nonNegative(
            this.annualPropertyTax() ?? 0,
          ),

        annualHomeownersInsurance:
          this.nonNegative(
            this.annualHomeownersInsurance() ??
            0,
          ),

        monthlyMortgageInsurance: 0,

        monthlyHoaFee:
          this.nonNegative(
            this.monthlyHoaFee() ?? 0,
          ),
      },
      {
        emitEvent: false,
      },
    );

    this.updateCalculationInputs();
  }

  private updateCalculationInputs(): void {
    const formValue =
      this.calculatorForm
        .getRawValue();

    this.calculationInputs.set({
      homePrice:
        this.nonNegative(
          formValue.homePrice,
        ),

      downPaymentAmount:
        this.nonNegative(
          formValue.downPaymentAmount,
        ),

      downPaymentPercent:
        this.limitPercentage(
          formValue.downPaymentPercent,
        ),

      interestRate:
        this.nonNegative(
          formValue.interestRate,
        ),

      loanTermYears:
        this.nonNegative(
          formValue.loanTermYears,
        ),

      annualPropertyTax:
        this.nonNegative(
          formValue.annualPropertyTax,
        ),

      annualHomeownersInsurance:
        this.nonNegative(
          formValue
            .annualHomeownersInsurance,
        ),

      monthlyMortgageInsurance:
        this.nonNegative(
          formValue
            .monthlyMortgageInsurance,
        ),

      monthlyHoaFee:
        this.nonNegative(
          formValue.monthlyHoaFee,
        ),
    });
  }

  private calculatePrincipalAndInterest(
    loanAmount: number,
    monthlyInterestRate: number,
    paymentCount: number,
  ): number {
    if (
      loanAmount <= 0 ||
      paymentCount <= 0
    ) {
      return 0;
    }

    if (monthlyInterestRate === 0) {
      return (
        loanAmount /
        paymentCount
      );
    }

    const interestFactor =
      Math.pow(
        1 + monthlyInterestRate,
        paymentCount,
      );

    return (
      loanAmount *
      (
        monthlyInterestRate *
        interestFactor
      )
    ) /
      (
        interestFactor -
        1
      );
  }

  private chartDegrees(
    amount: number,
    total: number,
  ): number {
    if (
      amount <= 0 ||
      total <= 0
    ) {
      return 0;
    }

    return (
      amount /
      total
    ) * 360;
  }

  private nonNegative(
    value: number,
  ): number {
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return 0;
    }

    return value;
  }

  private limitPercentage(
    value: number,
  ): number {
    return Math.min(
      this.nonNegative(value),
      100,
    );
  }

  private roundCurrency(
    value: number,
  ): number {
    return (
      Math.round(
        value * 100,
      ) / 100
    );
  }

  private roundPercentage(
    value: number,
  ): number {
    return (
      Math.round(
        value * 100,
      ) / 100
    );
  }
}