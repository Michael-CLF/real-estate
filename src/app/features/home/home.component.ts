import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { StateExplorerComponent } from './state-explorer/state-explorer.component';

interface PlatformBenefit {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}

interface FeaturedHome {
  readonly location: string;
  readonly price: string;
  readonly beds: number;
  readonly baths: number;
  readonly squareFeet: string;
  readonly imageClass: string;
}

interface MortgageTool {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly route: string;
}

interface ProcessStep {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    StateExplorerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly benefits: readonly PlatformBenefit[] = [
    {
      number: '01',
      title: 'Sell for a flat fee',
      description:
        'List your property without automatically giving away a percentage of your equity.',
    },
    {
      number: '02',
      title: 'Follow a guided process',
      description:
        'Move through listing, offers, documents, financing, and closing with clear next steps.',
    },
    {
      number: '03',
      title: 'Use professional tools',
      description:
        'Access practical real estate and mortgage tools in one connected platform.',
    },
    {
      number: '04',
      title: 'Stay in control',
      description:
        'Manage your property, communications, and transaction from your own account.',
    },
  ];

  protected readonly featuredHomes: readonly FeaturedHome[] = [
    {
      location: 'Wake Forest, North Carolina',
      price: '$489,000',
      beds: 4,
      baths: 3,
      squareFeet: '2,641',
      imageClass: 'featured-home-card__image--one',
    },
    {
      location: 'Raleigh, North Carolina',
      price: '$625,000',
      beds: 4,
      baths: 3,
      squareFeet: '3,105',
      imageClass: 'featured-home-card__image--two',
    },
    {
      location: 'Cary, North Carolina',
      price: '$549,900',
      beds: 3,
      baths: 3,
      squareFeet: '2,384',
      imageClass: 'featured-home-card__image--three',
    },
  ];

  protected readonly mortgageTools: readonly MortgageTool[] = [
    {
      eyebrow: 'Monthly payment',
      title: 'Mortgage Calculator',
      description:
        'Estimate principal, interest, taxes, insurance, and your total monthly payment.',
      route: '/mortgage',
    },
    {
      eyebrow: 'Buying power',
      title: 'Affordability Calculator',
      description:
        'Explore a potential home-buying range based on income, debts, and available funds.',
      route: '/mortgage',
    },
    {
      eyebrow: 'Loan comparison',
      title: 'Refinance Calculator',
      description:
        'Compare your current mortgage with a potential refinance and estimate the break-even point.',
      route: '/mortgage',
    },
  ];

  protected readonly processSteps: readonly ProcessStep[] = [
    {
      number: '1',
      title: 'Create your account',
      description:
        'Build your secure NavStreet profile and choose whether you are buying or selling.',
    },
    {
      number: '2',
      title: 'Prepare your property',
      description:
        'Add the property details, photos, pricing, and information buyers need to evaluate your home.',
    },
    {
      number: '3',
      title: 'Manage the transaction',
      description:
        'Review interest, communicate, organize documents, and follow each step from one dashboard.',
    },
    {
      number: '4',
      title: 'Move toward closing',
      description:
        'Keep the people, financing, documents, and milestones surrounding the transaction organized.',
    },
  ];
}