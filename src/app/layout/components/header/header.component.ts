import {
  ChangeDetectionStrategy,
  Component,
  signal
} from '@angular/core';
import {
  RouterLink
} from '@angular/router';

import {
  NavigationComponent
} from '../navigation/navigation.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NavigationComponent,
    RouterLink
  ],
  selector: 'app-header',
  standalone: true,
  styleUrl: './header.component.scss',
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  protected readonly isMobileMenuOpen = signal(false);

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((isOpen) => !isOpen);
  }
}