import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  signOut
} from 'firebase/auth';

import {
  auth
} from '../../../../core/infrastructure/firebase/firebase';

interface DashboardNavigationItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

interface DashboardNavigationGroup {
  label: string;
  items: ReadonlyArray<DashboardNavigationItem>;
}

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl:
    './dashboard-sidebar.component.html',
  styleUrl:
    './dashboard-sidebar.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardSidebarComponent {

  private readonly router =
    inject(Router);

  readonly mobileOpen =
    input(false);

  readonly navigationSelected =
    output<void>();

  protected readonly navigationGroups:
    ReadonlyArray<DashboardNavigationGroup> = [
      {
        label: 'Dashboard',
        items: [
          {
            label: 'Overview',
            icon:
              'fa-solid fa-table-columns',
            route:
              '/dashboard',
            exact: true
          }
        ]
      },
      {
        label: 'Properties',
        items: [
          {
            label: 'My listings',
            icon:
              'fa-solid fa-house',
            route:
              '/dashboard/listings'
          },
          {
            label: 'Saved properties',
            icon:
              'fa-solid fa-heart',
            route:
              '/dashboard/saved-properties'
          },
          {
            label: 'Showings',
            icon:
              'fa-solid fa-calendar-check',
            route:
              '/dashboard/showings'
          }
        ]
      },
      {
        label: 'Transactions',
        items: [
          {
            label: 'Offers',
            icon:
              'fa-solid fa-file-signature',
            route:
              '/dashboard/offers'
          },
          {
            label: 'Inquiries',
            icon:
              'fa-solid fa-message',
            route:
              '/dashboard/inquiries'
          },
          {
            label: 'Recent activity',
            icon:
              'fa-solid fa-clock-rotate-left',
            route:
              '/dashboard/activity'
          }
        ]
      },
      {
        label: 'Business',
        items: [
          {
            label: 'Business account',
            icon:
              'fa-solid fa-briefcase',
            route:
              '/dashboard/business'
          }
        ]
      },
      {
        label: 'Account',
        items: [
          {
            label: 'Account settings',
            icon:
              'fa-solid fa-gear',
            route:
              '/dashboard/account'
          }
        ]
      }
    ];

  protected closeNavigation(): void {
    this.navigationSelected.emit();
  }

  protected async signOutUser(): Promise<void> {
    try {
      await signOut(auth);

      this.navigationSelected.emit();

      await this.router.navigate([
        '/'
      ]);
    } catch (error: unknown) {
      console.error(
        'Unable to sign out:',
        error
      );
    }
  }
}