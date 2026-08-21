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
  changeDetection:
    ChangeDetectionStrategy.OnPush,

  imports: [
    RouterLink,
    RouterLinkActive
  ],

  selector:
    'app-navigation',

  standalone: true,

  styleUrl:
    './navigation.component.scss',

  templateUrl:
    './navigation.component.html'
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
          '/professionals/north-carolina'
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