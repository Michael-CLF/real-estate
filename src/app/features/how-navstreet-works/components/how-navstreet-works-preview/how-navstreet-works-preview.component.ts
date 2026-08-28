import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  AnalyticsDataLayerService
} from '../../../../core/analytics/analytics-data-layer.service';

interface PreviewCapability {
  description: string;
  icon: string;
  title: string;
}

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,

  imports: [
    RouterLink
  ],

  selector:
    'app-how-navstreet-works-preview',

  standalone:
    true,

  styleUrl:
    './how-navstreet-works-preview.component.scss',

  templateUrl:
    './how-navstreet-works-preview.component.html'
})
export class HowNavStreetWorksPreviewComponent {

  private readonly analytics =
    inject(AnalyticsDataLayerService);

  protected readonly capabilities:
    readonly PreviewCapability[] = [
      {
        description:
          'Create detailed property listings with photographs, nearby schools and hundreds of available features and amenities.',
        icon:
          'fa-solid fa-house-circle-check',
        title:
          'Comprehensive Listings'
      },
      {
        description:
          'Send property-specific messages, connect directly with sellers and request showings through NavStreet.',
        icon:
          'fa-solid fa-comments',
        title:
          'Direct Connections'
      },
      {
        description:
          'Use mortgage, affordability and closing-cost tools to better understand the financial picture.',
        icon:
          'fa-solid fa-calculator',
        title:
          'Financial Clarity'
      },
      {
        description:
          'Explore educational resources for buying, selling, financing and navigating a real estate transaction.',
        icon:
          'fa-solid fa-graduation-cap',
        title:
          'Guidance and Education'
      }
    ];

  protected trackProductTourClick():
    void {
    this.analytics.track(
      'how_navstreet_cta_clicked',
      {
        cta_name:
          'homepage_product_tour',

        destination:
          '/how-navstreet-works',

        section_name:
          'homepage_preview'
      }
    );
  }

}