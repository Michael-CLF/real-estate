import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

interface NavigationItem {
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
  readonly isMobileMenuOpen =
    input(false);

  readonly navigationSelected =
    output<void>();

  protected readonly navigationItems:
    readonly NavigationItem[] = [
      {
        label: 'Homes',
        route: '/homes'
      },
      {
        label: 'Sell Your Home',
        route: '/sell'
      },
      {
        label: 'Calculators',
        route: '/calculators'
      },
      {
        label: 'Find a Pro',
        route:
          '/find-a-pro/north-carolina'
      },
      {
        label: 'List Your Business',
        route:
          '/professionals/register/north-carolina'
      },
      {
        label: 'FAQ',
        route: '/faq'
      }
    ];

  protected handleNavigationSelected():
    void {
    this.navigationSelected.emit();
  }
}