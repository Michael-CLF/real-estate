import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  AdministrationBusiness,
  AdministrationBusinessesService,
  AdministrationBusinessStatus,
  AdministrationBusinessSummary
} from '../../data-access/administration-businesses.service';

type BusinessStatusFilter =
  | 'all'
  | AdministrationBusinessStatus;

type BusinessSubscriptionFilter =
  | 'all'
  | 'free'
  | 'profile';

@Component({
  selector:
    'app-administration-businesses',

  standalone:
    true,

  imports: [
    DatePipe
  ],

  templateUrl:
    './businesses.component.html',

  styleUrl:
    './businesses.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class BusinessesComponent
  implements OnInit {

  private readonly businessesService =
    inject(
      AdministrationBusinessesService
    );

  protected readonly businesses =
    signal<
      AdministrationBusiness[]
    >([]);

  protected readonly summary =
    signal<AdministrationBusinessSummary>({
      totalBusinesses: 0,
      activeBusinesses: 0,
      suspendedBusinesses: 0,
      removedBusinesses: 0,
      profileSubscribers: 0,
      sponsoredBusinesses: 0
    });

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);

  protected readonly searchTerm =
    signal('');

  protected readonly statusFilter =
    signal<BusinessStatusFilter>(
      'all'
    );

  protected readonly subscriptionFilter =
    signal<BusinessSubscriptionFilter>(
      'all'
    );

  protected readonly filteredBusinesses =
    computed(() => {
      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const selectedStatus =
        this.statusFilter();

      const selectedSubscription =
        this.subscriptionFilter();

      return this.businesses().filter(
        business => {
          const matchesStatus =
            selectedStatus === 'all' ||
            business.status ===
              selectedStatus;

          const matchesSubscription =
            selectedSubscription ===
              'all' ||
            business
              .subscriptionStatus ===
              selectedSubscription;

          if (
            !matchesStatus ||
            !matchesSubscription
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          return [
            business.businessName,
            business.category,
            business.professionalType,
            business.email,
            business.phone,
            business.ownerUid,
            business.stateName,
            business.stateAbbreviation
          ].some(
            value =>
              value
                .toLowerCase()
                .includes(search)
          );
        }
      );
    });

  ngOnInit(): void {
    void this.loadBusinesses();
  }

  protected onSearch(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(
      input.value
    );
  }

  protected setStatusFilter(
    status: BusinessStatusFilter
  ): void {
    this.statusFilter.set(status);
  }

  protected setSubscriptionFilter(
    subscription:
      BusinessSubscriptionFilter
  ): void {
    this.subscriptionFilter.set(
      subscription
    );
  }

  protected refresh(): void {
    void this.loadBusinesses();
  }

  protected formatLabel(
    value: string
  ): string {
    return value
      .replace(
        /_/g,
        ' '
      );
  }

  protected formatServiceArea(
    business:
      AdministrationBusiness
  ): string {
    switch (
      business.serviceAreaType
    ) {
      case 'counties':
        return (
          business.counties.join(', ') ||
          'Counties not specified'
        );

      case 'cities':
        return (
          business.cities.join(', ') ||
          'Cities not specified'
        );

      default:
        return (
          business.stateName ||
          business.stateAbbreviation ||
          'Statewide'
        );
    }
  }

  private async loadBusinesses():
    Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result =
        await this.businessesService
          .getBusinesses();

      this.businesses.set(
        result.businesses
      );

      this.summary.set(
        result.summary
      );

    } catch (error: unknown) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'NavStreet businesses could not be loaded.'
      );

    } finally {
      this.loading.set(false);
    }
  }
}