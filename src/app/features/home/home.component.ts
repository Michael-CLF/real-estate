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

import {
  StateExplorerComponent
} from './state-explorer/state-explorer.component';

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

interface AudiencePath {
  readonly icon: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly route: string;
  readonly action: string;
}

interface SellerFeature {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

interface MarketingFeature {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

interface MortgageTool {
  readonly icon: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly route: string;
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
  changeDetection:
    ChangeDetectionStrategy.OnPush
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

  protected readonly audiencePaths:
    readonly AudiencePath[] = [
      {
        icon: 'fa-solid fa-house-circle-check',
        eyebrow: 'For homeowners',
        title: 'Sell your home',
        description:
          'Create, publish, market, and manage your property through one guided seller experience.',
        route: '/sell',
        action: 'Explore selling'
      },
      {
        icon: 'fa-solid fa-magnifying-glass-location',
        eyebrow: 'For homebuyers',
        title: 'Find your next home',
        description:
          'Browse detailed listings, save favorites, contact sellers, request showings, and prepare offers.',
        route: '/buy',
        action: 'Browse homes'
      },
      {
        icon: 'fa-solid fa-calculator',
        eyebrow: 'For better decisions',
        title: 'Understand the numbers',
        description:
          'Estimate payments, affordability, closing costs, and financing scenarios with practical calculators.',
        route: '/mortgage',
        action: 'Use calculators'
      },
      {
        icon: 'fa-solid fa-user-tie',
        eyebrow: 'For local expertise',
        title: 'Connect with professionals',
        description:
          'Find real estate service providers and business profiles that can help move the transaction forward.',
        route: '/professionals',
        action: 'Find a professional'
      }
    ];

  protected readonly sellerFeatures:
    readonly SellerFeature[] = [
      {
        icon: 'fa-solid fa-list-check',
        title: 'Guided listing creation',
        description:
          'A six-step process organizes the address, property details, features, photos, pricing, and final review.'
      },
      {
        icon: 'fa-solid fa-cloud-arrow-up',
        title: 'Automatic draft saving',
        description:
          'Progress is saved securely so sellers can leave, return, and continue from the first incomplete step.'
      },
      {
        icon: 'fa-solid fa-shield-halved',
        title: 'Verified publication',
        description:
          'Seller certification, identity verification, and secure Stripe payment support a trusted publication flow.'
      },
      {
        icon: 'fa-solid fa-sliders',
        title: 'Property enhancements',
        description:
          'Add optional room, construction, accessibility, outdoor, parking, utility, and security details.'
      },
      {
        icon: 'fa-solid fa-comments',
        title: 'Buyer engagement',
        description:
          'Receive inquiries, showing requests, offers, favorites, and listing activity from one seller dashboard.'
      },
      {
        icon: 'fa-solid fa-pen-to-square',
        title: 'Listing management',
        description:
          'Update the price and description, monitor status, and keep the public listing current after publication.'
      }
    ];

  protected readonly marketingFeatures:
    readonly MarketingFeature[] = [
      {
        icon: 'fa-solid fa-link',
        title: 'Permanent sharing link',
        description:
          'Use a short NavStreet URL that takes buyers directly to the public property listing.'
      },
      {
        icon: 'fa-solid fa-pen-nib',
        title: 'Ready-to-use captions',
        description:
          'Customize and copy short, detailed, or property-highlight captions for social posts.'
      },
      {
        icon: 'fa-solid fa-share-nodes',
        title: 'Social and email sharing',
        description:
          'Share through a device, Facebook, LinkedIn, X, or email without rebuilding the listing message.'
      },
      {
        icon: 'fa-solid fa-qrcode',
        title: 'Downloadable QR code',
        description:
          'Create PNG and scalable SVG codes for signs, postcards, documents, and printed materials.'
      },
      {
        icon: 'fa-solid fa-list-check',
        title: 'Marketing checklist',
        description:
          'Track completed promotional steps and keep the seller’s marketing activity organized.'
      }
    ];

  protected readonly mortgageTools:
    readonly MortgageTool[] = [
      {
        icon: 'fa-solid fa-house-chimney',
        eyebrow: 'Monthly payment',
        title: 'Mortgage Calculator',
        description:
          'Estimate principal, interest, taxes, insurance, and the total monthly housing payment.',
        route: '/mortgage'
      },
      {
        icon: 'fa-solid fa-wallet',
        eyebrow: 'Buying power',
        title: 'Affordability Calculator',
        description:
          'Explore a potential price range using income, debts, available funds, and financing assumptions.',
        route: '/mortgage'
      },
      {
        icon: 'fa-solid fa-file-invoice-dollar',
        eyebrow: 'Transaction planning',
        title: 'Closing Cost Calculator',
        description:
          'Prepare for the expenses that may accompany a purchase, sale, or mortgage transaction.',
        route: '/mortgage'
      }
    ];
}
