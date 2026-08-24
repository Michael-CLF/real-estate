import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

interface AdministrationNavigationItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector:
    'app-administration-sidebar',

  standalone:
    true,

  imports: [
    RouterLink,
    RouterLinkActive
  ],

  templateUrl:
    './administration-sidebar.component.html',

  styleUrl:
    './administration-sidebar.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class AdministrationSidebarComponent {
  readonly mobileOpen =
    input(false);

  readonly navigationSelected =
    output<void>();

  protected readonly navigationItems:
    AdministrationNavigationItem[] = [
      {
        label:
          'Overview',

        route:
          '/administration',

        icon:
          'fa-solid fa-chart-line'
      },
      {
        label:
          'Users',

        route:
          '/administration/users',

        icon:
          'fa-solid fa-users'
      },
      {
        label:
          'Listings',

        route:
          '/administration/listings',

        icon:
          'fa-solid fa-house'
      },
      {
        label:
          'Businesses',

        route:
          '/administration/businesses',

        icon:
          'fa-solid fa-building'
      },
      {
        label:
          'Promotion codes',

        route:
          '/administration/promotion-codes',

        icon:
          'fa-solid fa-ticket'
      },
      {
        label:
          'Payments',

        route:
          '/administration/payments',

        icon:
          'fa-solid fa-credit-card'
      },
      {
        label:
          'Subscriptions',

        route:
          '/administration/subscriptions',

        icon:
          'fa-solid fa-arrows-rotate'
      },
      {
        label:
          'Activity',

        route:
          '/administration/activity',

        icon:
          'fa-solid fa-clock-rotate-left'
      },
      {
        label:
          'Settings',

        route:
          '/administration/settings',

        icon:
          'fa-solid fa-gear'
      }
    ];

  protected selectNavigation():
    void {
    this.navigationSelected.emit();
  }
}