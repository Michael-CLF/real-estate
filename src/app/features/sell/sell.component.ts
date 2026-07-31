import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardStateService } from '../dashboard/services/dashboard-state.service';
import { DraftListingsComponent } from '../dashboard/components/draft-listings/draft-listings.component';


@Component({
  selector: 'app-sell',
  standalone: true,
  imports: [
    RouterLink,
    DraftListingsComponent,
  ],
  templateUrl: './sell.component.html',
  styleUrl: './sell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SellComponent {
  protected readonly dashboardState = inject(DashboardStateService);
}