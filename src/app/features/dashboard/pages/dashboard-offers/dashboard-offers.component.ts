import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

@Component({
  selector: 'app-dashboard-offers',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl:
    './dashboard-offers.component.html',
  styleUrl:
    './dashboard-offers.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardOffersComponent {}