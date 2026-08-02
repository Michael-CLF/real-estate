import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../core/authentication/services/auth.service';

import {
  AuthState
} from '../../../core/authentication/state/auth.state';

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

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  protected readonly authState =
    inject(AuthState);

  protected readonly isMobileMenuOpen =
    signal(false);

  protected readonly isLoggingOut =
    signal(false);

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(
      isOpen => !isOpen
    );
  }

  protected async logout(): Promise<void> {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);

    try {
      await this.authService.logout();

      this.closeMobileMenu();

      await this.router.navigate(['/']);
    } catch (error) {
      console.error(
        'Unable to sign out:',
        error
      );
    } finally {
      this.isLoggingOut.set(false);
    }
  }
}