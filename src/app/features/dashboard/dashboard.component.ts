import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { DraftListingsComponent } from './components/draft-listings/draft-listings.component';
import { DashboardStateService } from './services/dashboard-state.service';
import { SavedHomesComponent } from './components/saved-homes/saved-homes.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DraftListingsComponent,
    SavedHomesComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  protected readonly dashboardState = inject(DashboardStateService);

  async ngOnInit(): Promise<void> {
    await this.dashboardState.load();
  }

}