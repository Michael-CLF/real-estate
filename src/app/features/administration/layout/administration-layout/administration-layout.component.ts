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
  AdministrationSidebarComponent
} from '../administration-sidebar/administration-sidebar.component';

@Component({
  selector:
    'app-administration-layout',

  standalone:
    true,

  imports: [
    RouterOutlet,
    AdministrationSidebarComponent
  ],

  templateUrl:
    './administration-layout.component.html',

  styleUrl:
    './administration-layout.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class AdministrationLayoutComponent {
  protected readonly isMobileNavigationOpen =
    signal(false);

  protected openMobileNavigation():
    void {
    this.isMobileNavigationOpen.set(
      true
    );
  }

  protected closeMobileNavigation():
    void {
    this.isMobileNavigationOpen.set(
      false
    );
  }

  protected toggleMobileNavigation():
    void {
    this.isMobileNavigationOpen.update(
      isOpen =>
        !isOpen
    );
  }

  @HostListener(
    'document:keydown.escape'
  )
  protected closeNavigationWithEscape():
    void {
    this.closeMobileNavigation();
  }

  @HostListener(
    'window:resize'
  )
  protected closeNavigationAfterResize():
    void {
    if (
      window.innerWidth >=
      1024
    ) {
      this.closeMobileNavigation();
    }
  }
}