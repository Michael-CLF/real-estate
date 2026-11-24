import {
  ChangeDetectionStrategy,
  Component,
  inject,
  effect,
  ElementRef,
  HostListener,
  signal,
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

  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly resourcesOpen = signal(false);

  constructor() {
    effect(() => {
      if (!this.isMobileMenuOpen()) this.resourcesOpen.set(false);
    });
  }

  protected toggleResources(): void {
    this.resourcesOpen.update(open => !open);
  }

  @HostListener('document:click', ['$event'])
  protected closeOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.resourcesOpen.set(false);
    }
  }

  protected closeOnEscape(event: Event, trigger: HTMLButtonElement): void {
    if (!this.resourcesOpen()) return;
    event.stopPropagation();
    this.resourcesOpen.set(false);
    trigger.focus();
  }

  protected readonly resourceItems: readonly NavigationItem[] = [
    { analyticsName: 'blog', label: 'Blog', route: '/blog' },
    { analyticsName: 'calculators', label: 'Calculators', route: '/calculators' },
    { analyticsName: 'education_center', label: 'Education Center', route: '/education' },
    { analyticsName: 'research', label: 'Research', route: '/research' },
    { analyticsName: 'real_estate_savings', label: 'Real Estate Savings', route: '/research/real-estate-commission-savings-by-state' }
  ];

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
          'find_a_pro',
        label:
          'Find a Pro',
        route:
          '/find-a-pro'
      },
      {
        analyticsName:
          'list_your_business',
        label:
          'List Your Business',
        route:
          '/professionals/register/'
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

    this.resourcesOpen.set(false);
    this.navigationSelected.emit();
  }
}