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
  AdministrationSubscription,
  AdministrationSubscriptionsService,
  AdministrationSubscriptionSummary
} from '../../data-access/administration-subscriptions.service';

type SubscriptionStatusFilter =
  | 'all'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete';

@Component({
  selector:
    'app-administration-subscriptions',

  standalone:
    true,

  imports: [
    DatePipe
  ],

  templateUrl:
    './subscriptions.component.html',

  styleUrl:
    './subscriptions.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class SubscriptionsComponent
  implements OnInit {

  private readonly subscriptionsService =
    inject(
      AdministrationSubscriptionsService
    );

  protected readonly subscriptions =
    signal<
      AdministrationSubscription[]
    >([]);

  protected readonly summary =
    signal<AdministrationSubscriptionSummary>({
      totalSubscriptionRecords: 0,
      activeSubscriptions: 0,
      trialingSubscriptions: 0,
      pastDueSubscriptions: 0,
      canceledSubscriptions: 0,
      incompleteSubscriptions: 0,
      cancelScheduledSubscriptions: 0
    });

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);

  protected readonly searchTerm =
    signal('');

  protected readonly statusFilter =
    signal<SubscriptionStatusFilter>(
      'all'
    );

  protected readonly filteredSubscriptions =
    computed(() => {
      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const selectedStatus =
        this.statusFilter();

      return this.subscriptions().filter(
        subscription => {
          const matchesStatus =
            this.matchesStatus(
              subscription,
              selectedStatus
            );

          if (!matchesStatus) {
            return false;
          }

          if (!search) {
            return true;
          }

          return [
            subscription.businessName,
            subscription.email,
            subscription.ownerUid,
            subscription.professionalUid,
            subscription.stateName,
            subscription.stateAbbreviation,
            subscription.stripeCustomerId ?? '',
            subscription.stripeSubscriptionId ?? '',
            subscription.stripeCheckoutSessionId ?? ''
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
    void this.loadSubscriptions();
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
    status:
      SubscriptionStatusFilter
  ): void {
    this.statusFilter.set(status);
  }

  protected refresh(): void {
    void this.loadSubscriptions();
  }

  protected formatStatus(
    status: string
  ): string {
    return status
      .replace(
        /_/g,
        ' '
      );
  }

  private matchesStatus(
    subscription:
      AdministrationSubscription,

    filter:
      SubscriptionStatusFilter
  ): boolean {
    if (filter === 'all') {
      return true;
    }

    const status =
      subscription
        .stripeSubscriptionStatus;

    if (filter === 'canceled') {
      return [
        'canceled',
        'incomplete_expired',
        'unpaid'
      ].includes(status);
    }

    if (filter === 'incomplete') {
      return [
        'incomplete',
        'checkout_pending',
        'checkout_failed'
      ].includes(status);
    }

    return status === filter;
  }

  private async loadSubscriptions():
    Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result =
        await this.subscriptionsService
          .getSubscriptions();

      this.subscriptions.set(
        result.subscriptions
      );

      this.summary.set(
        result.summary
      );

    } catch (error: unknown) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'NavStreet subscriptions could not be loaded.'
      );

    } finally {
      this.loading.set(false);
    }
  }
}