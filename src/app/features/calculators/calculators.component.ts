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
import { CommonModule } from '@angular/common';

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
    RouterLink,
    CommonModule,
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
    this.pageSeo.setPage({
      title:
        'Free Real Estate & Mortgage Calculators | NavStreet',

      description:
        'Use seven free real estate and mortgage calculators to estimate mortgage payments, home affordability, real estate commissions, FSBO savings and more.',

      canonicalUrl:
        'https://navstreet.com/calculators/',

      imageAlt:
        'NavStreet free real estate and mortgage calculators'
    });
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
      },
      {
        title:
          'Real Estate Commission Savings Calculator',

        description:
          'Compare potential real estate agent commissions with the cost of selling your home by owner and estimate your potential savings.',

        route:
          '/calculators/commission-savings',

        icon:
          'fa-solid fa-piggy-bank',

        category:
          'Home selling savings'
      }
    ];
}