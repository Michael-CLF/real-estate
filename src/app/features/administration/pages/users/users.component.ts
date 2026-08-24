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
  AdministrationUser,
  AdministrationUsersService,
  AdministrationUserSummary
} from '../../data-access/administration-users.service';

@Component({
  selector: 'app-administration-users',

  standalone: true,

  imports: [
    DatePipe
  ],

  templateUrl:
    './users.component.html',

  styleUrl:
    './users.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class UsersComponent
  implements OnInit {

  private readonly usersService =
    inject(
      AdministrationUsersService
    );

  protected readonly users =
    signal<AdministrationUser[]>([]);

  protected readonly summary =
    signal<AdministrationUserSummary>({
      totalUsers: 0,
      activeUsers: 0,
      disabledUsers: 0,
      verifiedUsers: 0
    });

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);

  protected readonly searchTerm =
    signal('');

  protected readonly statusFilter =
    signal<
      'all' |
      'active' |
      'disabled'
    >('all');

  protected readonly filteredUsers =
    computed(() => {
      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const selectedStatus =
        this.statusFilter();

      return this.users().filter(
        user => {
          const matchesStatus =
            selectedStatus === 'all' ||
            user.status ===
              selectedStatus;

          if (!matchesStatus) {
            return false;
          }

          if (!search) {
            return true;
          }

          return [
            user.displayName,
            user.firstName,
            user.lastName,
            user.email,
            user.phone ?? '',
            user.accountNumber ?? ''
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
    void this.loadUsers();
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

  protected onStatusFilter(
    status:
      | 'all'
      | 'active'
      | 'disabled'
  ): void {
    this.statusFilter.set(status);
  }

  protected refresh(): void {
    void this.loadUsers();
  }

  private async loadUsers():
    Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result =
        await this.usersService
          .getUsers();

      this.users.set(
        result.users
      );

      this.summary.set(
        result.summary
      );

    } catch (error: unknown) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'NavStreet user accounts could not be loaded.'
      );

    } finally {
      this.loading.set(false);
    }
  }
}