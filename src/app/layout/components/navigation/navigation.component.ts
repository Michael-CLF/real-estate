import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  AnalyticsDataLayerService
} from '../../../core/analytics/analytics-data-layer.service';

interface NavigationItem {
  analyticsName: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl:
    './navigation.component.html',
  styleUrl:
    './navigation.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class NavigationComponent {
  private readonly analytics =
    inject(
      AnalyticsDataLayerService
    );

  readonly isMobileMenuOpen =
    input(false);

  readonly navigationSelected =
    output<void>();

  protected readonly navigationItems:
    readonly NavigationItem[] = [
      {
        analyticsName:
          'homes',
        label:
          'Homes',
        route:
          '/homes'
      },
      {
        analyticsName:
          'sell_your_home',
        label:
          'Sell Your Home',
        route:
          '/sell'
      },
      {
        analyticsName:
          'calculators',
        label:
          'Calculators',
        route:
          '/calculators'
      },
      {
        analyticsName:
          'education_center',
        label:
          'Education Center',
        route:
          '/education'
      },
      {
        analyticsName:
          'find_a_pro',
        label:
          'Find a Pro',
        route:
          '/find-a-pro/north-carolina'
      },
      {
        analyticsName:
          'list_your_business',
        label:
          'List Your Business',
        route:
          '/professionals/register/north-carolina'
      },
      {
        analyticsName:
          'pricing',
        label:
          'Pricing',
        route:
          '/pricing'
      },
      {
        analyticsName:
          'faq',
        label:
          'FAQ',
        route:
          '/faq'
      }
    ];
  protected handleNavigationSelected(
    item: NavigationItem
  ): void {
    console.log(
      'Header navigation selected:',
      item
    );

    this.analytics.track(
      'navigation_click',
      {
        navigation_location:
          'header',
        navigation_mode:
          this.isMobileMenuOpen()
            ? 'mobile'
            : 'desktop',
        link_name:
          item.analyticsName,
        link_text:
          item.label,
        destination:
          item.route
      }
    );

    this.navigationSelected.emit();
  }
}