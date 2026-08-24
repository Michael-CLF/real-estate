import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CurrencyPipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  AdministrationUsersService
} from '../../data-access/administration-users.service';

import {
  AdministrationListingsService
} from '../../data-access/administration-listings.service';

import {
  AdministrationBusinessesService
} from '../../data-access/administration-businesses.service';

import {
  AdministrationPaymentsService
} from '../../data-access/administration-payments.service';

import {
  AdministrationSubscriptionsService
} from '../../data-access/administration-subscriptions.service';

interface AdministrationSnapshot {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;

  totalListings: number;
  activeListings: number;
  featuredListings: number;
  inactiveListings: number;

  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  profileSubscribers: number;

  totalTransactions: number;
  pendingPayments: number;
  failedPayments: number;
  collectedAmount: number;
  discountAmount: number;

  activeSubscriptions: number;
  pastDueSubscriptions: number;
  cancelScheduledSubscriptions: number;
}

@Component({
  selector:
    'app-administration-overview',

  standalone:
    true,

  imports: [
    CurrencyPipe,
    RouterLink
  ],

  templateUrl:
    './administration-overview.component.html',

  styleUrl:
    './administration-overview.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class AdministrationOverviewComponent
  implements OnInit {

  private readonly usersService =
    inject(
      AdministrationUsersService
    );

  private readonly listingsService =
    inject(
      AdministrationListingsService
    );

  private readonly businessesService =
    inject(
      AdministrationBusinessesService
    );

  private readonly paymentsService =
    inject(
      AdministrationPaymentsService
    );

  private readonly subscriptionsService =
    inject(
      AdministrationSubscriptionsService
    );

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);

  protected readonly snapshot =
    signal<AdministrationSnapshot>(
      this.createEmptySnapshot()
    );

  ngOnInit(): void {
    void this.loadSnapshot();
  }

  protected refresh(): void {
    void this.loadSnapshot();
  }

  private async loadSnapshot():
    Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const results =
      await Promise.allSettled([
        this.usersService.getUsers(),
        this.listingsService.getListings(),
        this.businessesService.getBusinesses(),
        this.paymentsService.getPayments(),
        this.subscriptionsService
          .getSubscriptions()
      ]);

    const [
      usersResult,
      listingsResult,
      businessesResult,
      paymentsResult,
      subscriptionsResult
    ] = results;

    const nextSnapshot =
      this.createEmptySnapshot();

    if (
      usersResult.status ===
      'fulfilled'
    ) {
      const summary =
        usersResult.value.summary;

      nextSnapshot.totalUsers =
        summary.totalUsers;

      nextSnapshot.activeUsers =
        summary.activeUsers;

      nextSnapshot.disabledUsers =
        summary.disabledUsers;
    }

    if (
      listingsResult.status ===
      'fulfilled'
    ) {
      const summary =
        listingsResult.value.summary;

      nextSnapshot.totalListings =
        summary.totalListings;

      nextSnapshot.activeListings =
        summary.activeListings;

      nextSnapshot.featuredListings =
        summary.featuredListings;

      nextSnapshot.inactiveListings =
        summary.inactiveListings;
    }

    if (
      businessesResult.status ===
      'fulfilled'
    ) {
      const summary =
        businessesResult.value.summary;

      nextSnapshot.totalBusinesses =
        summary.totalBusinesses;

      nextSnapshot.activeBusinesses =
        summary.activeBusinesses;

      nextSnapshot.suspendedBusinesses =
        summary.suspendedBusinesses;

      nextSnapshot.profileSubscribers =
        summary.profileSubscribers;
    }

    if (
      paymentsResult.status ===
      'fulfilled'
    ) {
      const summary =
        paymentsResult.value.summary;

      nextSnapshot.totalTransactions =
        summary.totalTransactions;

      nextSnapshot.pendingPayments =
        summary.pendingTransactions;

      nextSnapshot.failedPayments =
        summary.failedTransactions;

      nextSnapshot.collectedAmount =
        summary.collectedAmount;

      nextSnapshot.discountAmount =
        summary.discountAmount;
    }

    if (
      subscriptionsResult.status ===
      'fulfilled'
    ) {
      const summary =
        subscriptionsResult.value.summary;

      nextSnapshot.activeSubscriptions =
        summary.activeSubscriptions;

      nextSnapshot.pastDueSubscriptions =
        summary.pastDueSubscriptions;

      nextSnapshot
        .cancelScheduledSubscriptions =
        summary
          .cancelScheduledSubscriptions;
    }

    this.snapshot.set(
      nextSnapshot
    );

    const failedResults =
      results.filter(
        result =>
          result.status ===
          'rejected'
      );

    if (
      failedResults.length ===
      results.length
    ) {
      this.error.set(
        'The administration snapshot could not be loaded.'
      );

    } else if (
      failedResults.length > 0
    ) {
      this.error.set(
        'Some administration totals could not be loaded. Refresh to try again.'
      );
    }

    failedResults.forEach(
      result => {
        if (
          result.status ===
          'rejected'
        ) {
          console.error(
            'Administration snapshot request failed:',
            result.reason
          );
        }
      }
    );

    this.loading.set(false);
  }

  private createEmptySnapshot():
    AdministrationSnapshot {
    return {
      totalUsers: 0,
      activeUsers: 0,
      disabledUsers: 0,

      totalListings: 0,
      activeListings: 0,
      featuredListings: 0,
      inactiveListings: 0,

      totalBusinesses: 0,
      activeBusinesses: 0,
      suspendedBusinesses: 0,
      profileSubscribers: 0,

      totalTransactions: 0,
      pendingPayments: 0,
      failedPayments: 0,
      collectedAmount: 0,
      discountAmount: 0,

      activeSubscriptions: 0,
      pastDueSubscriptions: 0,
      cancelScheduledSubscriptions: 0
    };
  }
}