import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  PageSeoService
} from '../../core/seo/page-seo.service';

interface CalculatorOption {
  title: string;
  description: string;
  route: string;
  icon: string;
  category: string;
}

@Component({
  selector:
    'app-calculators',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl:
    './calculators.component.html',

  styleUrl:
    './calculators.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class CalculatorsComponent {

  private readonly pageSeo =
    inject(PageSeoService);

  constructor() {
    this.pageSeo.set(
      'Free Mortgage & Real Estate Calculators | NavStreet',
      'Use NavStreet free mortgage and real estate calculators to estimate monthly payments, home affordability, loan-to-value ratios, and more.'
    );
  }

  protected readonly calculators:
    readonly CalculatorOption[] = [
      {
        title:
          'Mortgage Calculator',

        description:
          'Estimate principal, interest, property taxes, homeowners insurance and your total monthly housing payment.',

        route:
          '/calculators/mortgage-payment',

        icon:
          'fa-solid fa-house',

        category:
          'Monthly payment'
      },
      {
        title:
          'Affordability Calculator',

        description:
          'Estimate a potential home-buying range based on income, monthly obligations, available funds and interest rate.',

        route:
          '/calculators/affordability',

        icon:
          'fa-solid fa-wallet',

        category:
          'Buying power'
      },
      {
        title:
          'Interest-Only Calculator',

        description:
          'Calculate the periodic payment and total interest during an interest-only loan period.',

        route:
          '/calculators/interest-only',

        icon:
          'fa-solid fa-percent',

        category:
          'Loan payment'
      },
      {
        title:
          'Balloon Payment Calculator',

        description:
          'Estimate the regular payment, remaining principal balance and final balloon payment for a balloon loan.',

        route:
          '/calculators/balloon-payment',

        icon:
          'fa-solid fa-calendar-check',

        category:
          'Loan structure'
      },
      {
        title:
          'Loan-to-Value Calculator',

        description:
          'Calculate a loan-to-value ratio or estimate the maximum loan amount for a selected target LTV.',

        route:
          '/calculators/loan-to-value',

        icon:
          'fa-solid fa-scale-balanced',

        category:
          'Loan analysis'
      },
      {
        title:
          'Extra Payment Calculator',

        description:
          'See how additional monthly or annual principal payments could affect interest expense and loan payoff time.',

        route:
          '/calculators/extra-payment',

        icon:
          'fa-solid fa-forward',

        category:
          'Payoff planning'
      }
    ];
}