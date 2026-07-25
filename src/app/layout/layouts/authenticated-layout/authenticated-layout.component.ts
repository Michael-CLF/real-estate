import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { AppSidebarComponent } from '../../components/app-sidebar/app-sidebar.component';
import { MobileNavComponent } from '../../components/mobile-nav/mobile-nav.component';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AppHeaderComponent,
    AppSidebarComponent,
    MobileNavComponent
  ],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.scss'
})
export class AuthenticatedLayoutComponent {}