import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AccountListingsComponent
} from './components/account-listings/account-listings.component';

import {
  SavedHomesComponent
} from './components/saved-homes/saved-homes.component';

import {
  DashboardStateService
} from './services/dashboard-state.service';

import {
  Listing
} from '../../core/domains/listings/models/listing.model';

import {
  WelcomeComponent
} from './components/welcome/welcome.component';

import {
  ActivityCardComponent,
  ActivityItem
} from './components/activity-card/activity-card.component';

type ListingTab =
  | 'draft'
  | 'active'
  | 'under-contract'
  | 'sold';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    AccountListingsComponent,
    ActivityCardComponent,
    SavedHomesComponent,
    WelcomeComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  protected readonly dashboardState =
    inject(DashboardStateService);

  private readonly router =
    inject(Router);

  protected readonly selectedListingTab =
    signal<ListingTab>('active');

  protected readonly recentActivities: ActivityItem[] = [];

  async ngOnInit(): Promise<void> {
    await this.dashboardState.load();

    /*
     * Prefer Active when active listings exist.
     * Otherwise show Draft when drafts exist.
     */
    if (
      this.dashboardState.state()
        .activeListings.length > 0
    ) {
      this.selectedListingTab.set('active');
    } else if (
      this.dashboardState.state()
        .draftListings.length > 0
    ) {
      this.selectedListingTab.set('draft');
    }
  }

  protected selectListingTab(
    tab: ListingTab
  ): void {
    this.selectedListingTab.set(tab);
  }

  protected async manageListing(
    listing: Listing
  ): Promise<void> {

    if (listing.status === 'draft') {
      await this.router.navigate([
        '/sell/listings',
        listing.Uid,
        'edit'
      ]);

      return;
    }

    console.log(
      'Manage active listing:',
      listing
    );
  }
}