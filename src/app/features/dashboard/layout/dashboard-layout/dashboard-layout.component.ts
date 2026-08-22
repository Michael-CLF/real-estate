import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  signal
} from '@angular/core';

import {
  RouterOutlet
} from '@angular/router';

import {
  DashboardSidebarComponent
} from '../../components/dashboard-sidebar/dashboard-sidebar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    DashboardSidebarComponent
  ],
  templateUrl:
    './dashboard-layout.component.html',
  styleUrl:
    './dashboard-layout.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardLayoutComponent {

  protected readonly isMobileNavigationOpen =
    signal(false);

  protected openMobileNavigation(): void {
    this.isMobileNavigationOpen.set(true);
  }

  protected closeMobileNavigation(): void {
    this.isMobileNavigationOpen.set(false);
  }

  protected toggleMobileNavigation(): void {
    this.isMobileNavigationOpen.update(
      isOpen => !isOpen
    );
  }

  @HostListener(
    'document:keydown.escape'
  )
  protected closeNavigationWithEscape(): void {
    this.closeMobileNavigation();
  }

  @HostListener(
    'window:resize'
  )
  protected closeNavigationAfterResize(): void {
    if (window.innerWidth >= 1024) {
      this.closeMobileNavigation();
    }
  }
}