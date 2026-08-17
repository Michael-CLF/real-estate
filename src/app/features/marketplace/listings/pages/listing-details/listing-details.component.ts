import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  AsyncPipe,
  CurrencyPipe,
  DecimalPipe
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  RequestShowingComponent
} from '../../components/request-showing/request-showing.component';

import {
  catchError,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap
} from 'rxjs';

import {
  AuthState
} from '../../../../../core/authentication/state/auth.state';

import {
  MarketplaceListing
} from '../../../../../core/domains/marketplace/models/marketplace-listing.model';

import {
  MarketplaceListingRepository
} from '../../../../../core/domains/marketplace/repositories/marketplace-listing.repository';

import {
  FirestoreMarketplaceListingRepository
} from '../../../../../core/domains/marketplace/repositories/firestore-marketplace-listing.repository';

import {
  SavedListingService
} from '../../../../../core/domains/marketplace/services/saved-listing.service';

import {
  ListingEnhancements,
  ListingSchool,
  ListingSchools
} from '../../../../../core/domains/listings/models/listing.model';

import {
  ListingGalleryComponent
} from '../../components/listing-gallery/listing-gallery.component';

import {
  ListingMortgageCalculatorComponent
} from '../../components/listing-mortgage-calculator/listing-mortgage-calculator.component';

import {
  ListingBadge
} from '../../../../../core/domains/listings/models/listing-badge.model';

import {
  ListingBadgeService
} from '../../../../../core/domains/listings/services/listing-badge.service';

import {
  ContactSellerComponent
} from '../../components/contact-seller/contact-seller.component';

import {
  ListingViewService
} from '../../../../../core/domains/marketplace/services/listing-view.service';


interface ListingFact {
  label: string;
  value: string;
  icon: string;
}

interface EnhancementGroup {
  id: keyof ListingEnhancements;
  title: string;
  icon: string;
  features: string[];
}

interface NearbySchoolCard {
  id:
  | 'elementary'
  | 'middle'
  | 'high';

  level: string;
  icon: string;
  name: string;
  schoolType: string;
  grades?: string;
  distance?: string;
  district?: string;
}

interface NearbySchoolsViewModel {
  districtName?: string;
  assignedSchoolsVerified: boolean;
  schools: NearbySchoolCard[];
}

interface ListingDetailsViewModel {
  listing: MarketplaceListing | null;
  facts: ListingFact[];
  enhancementGroups: EnhancementGroup[];
  nearbySchools: NearbySchoolsViewModel | null;
  badges: ListingBadge[];
  hasError: boolean;
}

const ENHANCEMENT_SECTIONS: ReadonlyArray<
  Omit<EnhancementGroup, 'features'>
> = [
    { id: 'construction', title: 'Construction & Exterior', icon: 'fa-solid fa-house-chimney' },
    { id: 'interior', title: 'Interior & Living Spaces', icon: 'fa-solid fa-couch' },
    { id: 'kitchen', title: 'Kitchen', icon: 'fa-solid fa-kitchen-set' },
    { id: 'bedroomsBathrooms', title: 'Bedrooms & Bathrooms', icon: 'fa-solid fa-bed' },
    { id: 'parkingStorage', title: 'Parking & Storage', icon: 'fa-solid fa-car' },
    { id: 'outdoorLiving', title: 'Outdoor Living', icon: 'fa-solid fa-umbrella-beach' },
    { id: 'systemsUtilities', title: 'Systems, Utilities & Efficiency', icon: 'fa-solid fa-bolt' },
    { id: 'technologySecurity', title: 'Technology & Security', icon: 'fa-solid fa-house-signal' },
    { id: 'accessibility', title: 'Accessibility', icon: 'fa-solid fa-universal-access' },
    { id: 'communityAmenities', title: 'Community Amenities', icon: 'fa-solid fa-people-roof' }
  ];

@Component({
  selector: 'app-listing-details',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    ListingGalleryComponent,
    ListingMortgageCalculatorComponent,
    RequestShowingComponent,
    ContactSellerComponent
  ],
  providers: [
    {
      provide: MarketplaceListingRepository,
      useClass: FirestoreMarketplaceListingRepository
    }
  ],
  templateUrl: './listing-details.component.html',
  styleUrl: './listing-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingDetailsComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly authState =
    inject(AuthState);

  private readonly listingRepository =
    inject(MarketplaceListingRepository);

  private readonly savedListingService =
    inject(SavedListingService);

  private readonly listingViewService =
    inject(ListingViewService);

  private readonly listingBadgeService =
    inject(ListingBadgeService);

  readonly isSaved =
    signal(false);

  readonly isSaving =
    signal(false);

  readonly saveError =
    signal('');

  readonly displayedViewCount =
    signal(0);

  readonly viewModel$:
    Observable<ListingDetailsViewModel> =
    this.route.paramMap.pipe(
      map(
        params =>
          params.get('listingId') ?? ''
      ),

      switchMap(
        listingId =>
          this.listingRepository
            .getListingById(listingId)
            .pipe(
              map(
                listing => ({
                  listing,

                  facts:
                    listing
                      ? this.createListingFacts(
                        listing
                      )
                      : [],

                  enhancementGroups:
                    listing
                      ? this.createEnhancementGroups(
                        listing.enhancements
                      )
                      : [],

                  nearbySchools:
                    listing
                      ? this.createNearbySchools(
                        listing.schools
                      )
                      : null,

                  badges:
                    listing
                      ? this.listingBadgeService
                        .getBadges(listing)
                      : [],


                  hasError: false
                })
              ),

              catchError(
                () =>
                  of({
                    listing: null,
                    facts: [],
                    enhancementGroups: [],
                    nearbySchools: null,
                    badges: [],
                    hasError: true
                  })
              )
            )
      ),

      shareReplay({
        bufferSize: 1,
        refCount: true
      })
    );

      async ngOnInit(): Promise<void> {
    const viewModel =
      await firstValueFrom(
        this.viewModel$
      );

    if (!viewModel.listing) {
      return;
    }

    this.displayedViewCount.set(
      viewModel.listing.viewCount
    );

    /*
     * View recording is independent of saved-listing
     * state and also supports anonymous visitors.
     */
    try {
      const viewResult =
        await this.listingViewService
          .recordListingView(
            viewModel.listing.uid
          );

      this.displayedViewCount.set(
        viewResult.viewCount
      );
    } catch (error: unknown) {
      /*
       * Metrics must never prevent the public listing
       * from loading or displaying normally.
       */
      console.error(
        'Unable to record listing view:',
        error
      );
    }

    const userUid =
      this.authState.uid();

    if (!userUid) {
      return;
    }

    try {
      const saved =
        await this.savedListingService
          .isListingSaved(
            userUid,
            viewModel.listing.uid
          );

      this.isSaved.set(saved);

      const shouldSave =
        this.route.snapshot
          .queryParamMap
          .get(
            'saveListing'
          ) === 'true';

      if (
        shouldSave &&
        !saved
      ) {
        await this.saveListing(
          userUid,
          viewModel.listing
        );
      }

      if (shouldSave) {
        await this.router.navigate(
          [],
          {
            relativeTo:
              this.route,

            queryParams: {
              saveListing: null
            },

            queryParamsHandling:
              'merge',

            replaceUrl: true
          }
        );
      }
    } catch (error: unknown) {
      console.error(
        'Unable to load saved-listing status.',
        error
      );

      this.saveError.set(
        'We could not load your saved-listing status.'
      );
    }
  }
 

  async toggleSavedListing(
    listing: MarketplaceListing
  ): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    const userUid =
      this.authState.uid();

    if (!userUid) {
      const returnUrl =
        this.router.createUrlTree(
          [
            '/listings',
            listing.uid
          ],
          {
            queryParams: {
              saveListing: true
            }
          }
        ).toString();

      await this.router.navigate(
        ['/sign-in'],
        {
          queryParams: {
            returnUrl
          }
        }
      );

      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');

    try {
      if (this.isSaved()) {
        await this.savedListingService
          .removeSavedListing(
            userUid,
            listing.uid
          );

        this.isSaved.set(false);

      } else {
        await this.saveListing(
          userUid,
          listing
        );
      }

    } catch (error) {
      console.error(
        'Unable to update saved listing.',
        error
      );

      this.saveError.set(
        'We could not update this saved listing. Please try again.'
      );

    } finally {
      this.isSaving.set(false);
    }
  }

  private async saveListing(
    userUid: string,
    listing: MarketplaceListing
  ): Promise<void> {
    await this.savedListingService
      .saveListing(
        userUid,
        listing
      );

    this.isSaved.set(true);
  }

  private createListingFacts(
    listing: MarketplaceListing
  ): ListingFact[] {
    const facts: ListingFact[] = [];

    facts.push({
      label: 'Property type',
      value:
        this.formatPropertyType(
          listing.propertyType
        ),
      icon: 'fa-solid fa-house'
    });

    if (listing.bedrooms !== undefined) {
      facts.push({
        label: 'Bedrooms',
        value:
          listing.bedrooms.toString(),
        icon: 'fa-solid fa-bed'
      });
    }

    if (listing.bathrooms !== undefined) {
      facts.push({
        label: 'Bathrooms',
        value:
          listing.bathrooms.toString(),
        icon: 'fa-solid fa-bath'
      });
    }

    if (listing.squareFeet !== undefined) {
      facts.push({
        label: 'Square feet',
        value:
          listing.squareFeet.toLocaleString(),
        icon: 'fa-solid fa-ruler-combined'
      });
    }

    const lotSize =
      listing.lotSize ??
      listing.lotSizeAcres;

    if (lotSize !== undefined) {
      facts.push({
        label: 'Lot size',
        value:
          this.formatLotSize(
            lotSize,
            listing.lotSizeUnit ??
            'acres'
          ),
        icon: 'fa-solid fa-map'
      });
    }

    if (listing.yearBuilt !== undefined) {
      facts.push({
        label: 'Year built',
        value:
          listing.yearBuilt.toString(),
        icon: 'fa-solid fa-calendar'
      });
    }

    if (listing.hoa) {
      facts.push({
        label: 'HOA',
        value:
          listing.hoa.hasHoa
            ? 'Yes'
            : 'No',
        icon: 'fa-solid fa-people-roof'
      });

      if (
        listing.hoa.hasHoa &&
        listing.hoa.feeAmount !== undefined &&
        listing.hoa.feeFrequency
      ) {
        facts.push({
          label: 'HOA fee',
          value:
            `${this.formatCurrency(
              listing.hoa.feeAmount
            )} ${this.formatHoaFrequency(
              listing.hoa.feeFrequency
            )}`,
          icon: 'fa-solid fa-dollar-sign'
        });
      }
    }



    return facts;
  }

  private createNearbySchools(
    schools?: ListingSchools
  ): NearbySchoolsViewModel | null {
    if (!schools) {
      return null;
    }

    const schoolCards: NearbySchoolCard[] = [];

    this.addNearbySchool(
      schoolCards,
      'elementary',
      'Elementary School',
      'fa-solid fa-child-reaching',
      schools.elementarySchool
    );

    this.addNearbySchool(
      schoolCards,
      'middle',
      'Middle School',
      'fa-solid fa-book-open',
      schools.middleSchool
    );

    this.addNearbySchool(
      schoolCards,
      'high',
      'High School',
      'fa-solid fa-graduation-cap',
      schools.highSchool
    );

    if (schoolCards.length === 0) {
      return null;
    }

    return {
      districtName:
        schools.districtName,

      assignedSchoolsVerified:
        schools.assignedSchoolsVerified,

      schools:
        schoolCards
    };
  }

  private addNearbySchool(
    schoolCards: NearbySchoolCard[],
    id: NearbySchoolCard['id'],
    level: string,
    icon: string,
    school?: ListingSchool
  ): void {
    if (!school?.name) {
      return;
    }

    schoolCards.push({
      id,
      level,
      icon,
      name: school.name,

      schoolType:
        this.formatSchoolType(
          school.schoolType
        ),

      grades:
        school.grades,

      distance:
        school.distanceMiles !== undefined
          ? this.formatSchoolDistance(
            school.distanceMiles
          )
          : undefined,

      district:
        school.district
    });
  }

  private formatSchoolType(
    schoolType: ListingSchool['schoolType']
  ): string {
    switch (schoolType) {
      case 'charter':
        return 'Charter school';

      case 'magnet':
        return 'Magnet school';

      case 'private':
        return 'Private school';

      case 'public':
      default:
        return 'Public school';
    }
  }

  private formatSchoolDistance(
    distanceMiles: number
  ): string {
    const formattedDistance =
      new Intl.NumberFormat(
        'en-US',
        {
          maximumFractionDigits: 1
        }
      ).format(distanceMiles);

    return distanceMiles === 1
      ? `${formattedDistance} mile away`
      : `${formattedDistance} miles away`;
  }

  private createEnhancementGroups(
    enhancements?: ListingEnhancements
  ): EnhancementGroup[] {
    if (!enhancements) {
      return [];
    }

    return ENHANCEMENT_SECTIONS
      .map(section => ({
        ...section,
        features: (
          enhancements[section.id] ?? []
        ).map(featureId =>
          this.formatFeatureLabel(featureId)
        )
      }))
      .filter(group => group.features.length > 0);
  }

  private formatFeatureLabel(
    featureId: string
  ): string {
    const label = featureId
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, character =>
        character.toUpperCase()
      );

    return label
      .replace(/\bHoa\b/g, 'HOA')
      .replace(/\bHvac\b/g, 'HVAC')
      .replace(/\bEv\b/g, 'EV')
      .replace(/\bRv\b/g, 'RV')
      .replace(/\bWifi\b/g, 'Wi-Fi')
      .replace(/\bLed\b/g, 'LED')
      .replace(/\bUsb\b/g, 'USB');
  }

  private formatLotSize(
    lotSize: number,
    lotSizeUnit:
      NonNullable<
        MarketplaceListing['lotSizeUnit']
      >
  ): string {
    if (lotSizeUnit === 'square_feet') {
      const formattedSquareFeet =
        new Intl.NumberFormat(
          'en-US',
          {
            maximumFractionDigits: 0
          }
        ).format(lotSize);

      return `${formattedSquareFeet} sq. ft.`;
    }

    const formattedAcres =
      new Intl.NumberFormat(
        'en-US',
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }
      ).format(lotSize);

    return formattedAcres === '1'
      ? '1 acre'
      : `${formattedAcres} acres`;
  }

  private formatCurrency(
    amount: number
  ): string {
    return new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(amount);
  }

  protected getMonthlyHoaFee(
    hoa: MarketplaceListing['hoa']
  ): number {
    if (
      !hoa?.hasHoa ||
      hoa.feeAmount === undefined
    ) {
      return 0;
    }

    switch (hoa.feeFrequency) {
      case 'monthly':
        return hoa.feeAmount;

      case 'quarterly':
        return hoa.feeAmount / 3;

      case 'semi_annually':
        return hoa.feeAmount / 6;

      case 'annually':
        return hoa.feeAmount / 12;

      default:
        return 0;
    }
  }

  private formatHoaFrequency(
    frequency: string
  ): string {
    switch (frequency) {
      case 'monthly':
        return 'monthly';

      case 'quarterly':
        return 'quarterly';

      case 'semi_annually':
        return 'semi-annually';

      case 'annually':
        return 'annually';

      default:
        return frequency;
    }
  }

  private formatPropertyType(
    propertyType:
      MarketplaceListing['propertyType']
  ): string {
    switch (propertyType) {
      case 'single_family':
        return 'Single-family home';

      case 'condominium':
        return 'Condominium';

      case 'townhouse':
        return 'Townhouse';

      case 'multifamily':
        return 'Multifamily';

      case 'manufactured':
        return 'Manufactured home';

      case 'land':
        return 'Land';

      case 'farm':
        return 'Farm';

      case 'other':
      default:
        return 'Other';
    }
  }
}