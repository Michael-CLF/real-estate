import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  DashboardStateService
} from '../../services/dashboard-state.service';

@Component({
  selector: 'app-dashboard-account',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl:
    './dashboard-account.component.html',
  styleUrl:
    './dashboard-account.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardAccountComponent
  implements OnInit {

  protected readonly dashboardState =
    inject(DashboardStateService);

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly userProfile =
    computed(
      () =>
        this.dashboardState.state()
          .userProfile
    );

  protected readonly formattedTelephone =
    computed(() => {
      const phone =
        this.userProfile()?.phone ?? '';

      return this.formatTelephone(phone);
    });

  protected readonly displayName =
    computed(() => {
      const profile =
        this.userProfile();

      if (!profile) {
        return 'NavStreet account holder';
      }

      const fullName =
        profile.fullName.trim();

      if (fullName) {
        return fullName;
      }

      const combinedName = [
        profile.firstName,
        profile.lastName
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      return (
        combinedName ||
        'NavStreet account holder'
      );
    });

  async ngOnInit(): Promise<void> {
    await this.loadAccount();
  }

  protected reloadAccount(): void {
    void this.loadAccount();
  }

  private async loadAccount():
    Promise<void> {

    this.isLoading.set(true);
    this.loadError.set('');

    try {
      await this.dashboardState.load();

      if (!this.userProfile()) {
        this.loadError.set(
          'Your NavStreet account information ' +
          'could not be found.'
        );
      }
    } catch (error: unknown) {
      console.error(
        'Unable to load NavStreet account:',
        error
      );

      this.loadError.set(
        'Your account information could not ' +
        'be loaded. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private formatTelephone(
    value: string
  ): string {
    const digits =
      value.replace(/\D/g, '');

    if (digits.length === 10) {
      return (
        `(${digits.slice(0, 3)}) ` +
        `${digits.slice(3, 6)}-` +
        digits.slice(6)
      );
    }

    if (
      digits.length === 11 &&
      digits.startsWith('1')
    ) {
      return (
        `+1 (${digits.slice(1, 4)}) ` +
        `${digits.slice(4, 7)}-` +
        digits.slice(7)
      );
    }

    return value.trim() || 'Not provided';
  }
}