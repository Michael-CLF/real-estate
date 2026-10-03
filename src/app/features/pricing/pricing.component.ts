import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  PageSeoService
} from '../../core/seo/page-seo.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class PricingComponent {
  private readonly pageSeo =
    inject(PageSeoService);

  constructor() {
    this.pageSeo.set(
      'For Sale by Owner Listing Pricing | NavStreet',
      'Explore NavStreet listing fees, optional upgrades and business directory options.'
    );
  }
}