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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  selector: 'app-navigation',
  standalone: true,
  styleUrl: './navigation.component.scss',
  templateUrl: './navigation.component.html'
})
export class NavigationComponent {
  readonly isMobileMenuOpen = input(false);

  readonly navigationSelected = output<void>();

  protected readonly navigationItems: NavigationItem[] = [
    {
      label: 'Buy',
      route: '/buy'
    },
    {
      label: 'Sell',
      route: '/sell'
    },
    {
      label: 'Mortgage',
      route: '/mortgage'
    },
    {
      label: 'Resources',
      route: '/resources'
    },
    {
      label: 'About',
      route: '/about'
    }
  ];

  protected handleNavigationSelected(): void {
    this.navigationSelected.emit();
  }
}