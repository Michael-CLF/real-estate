import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  AsyncPipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  catchError,
  Observable,
  of,
  shareReplay
} from 'rxjs';

import { StateExplorerComponent } from './state-explorer/state-explorer.component';

import {
  MarketplaceListingSummary
} from '../../core/domains/marketplace/models/listing-search-filters.model';

import {
  MarketplaceListingRepository
} from '../../core/domains/marketplace/repositories/marketplace-listing.repository';

import {
  FirestoreMarketplaceListingRepository
} from '../../core/domains/marketplace/repositories/firestore-marketplace-listing.repository';

import {
  ListingCardComponent
} from '../marketplace/search/components/listing-card/listing-card.component';

interface PlatformBenefit {
  readonly number: string;
  readonly title: string;
  readonly description: string;
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
    AsyncPipe,
    RouterLink,
    ListingCardComponent,
    StateExplorerComponent
  ],
  providers: [
    {
      provide: MarketplaceListingRepository,
      useClass:
        FirestoreMarketplaceListingRepository
    }
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})


export class HomeComponent {
  private readonly listingRepository =
    inject(MarketplaceListingRepository);

  protected readonly featuredListings$:
    Observable<MarketplaceListingSummary[]> =
    this.listingRepository
      .getFeaturedListings(3)
      .pipe(
        catchError(() =>
          of(
            [] as MarketplaceListingSummary[]
          )
        ),

        shareReplay({
          bufferSize: 1,
          refCount: true
        })
      );

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