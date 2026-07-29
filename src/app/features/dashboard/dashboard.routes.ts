import { Routes } from '@angular/router';

import { authGuard } from '../../core/authentication/auth.guard';
import { AuthenticatedLayoutComponent } from '../../layout/layouts/authenticated-layout/authenticated-layout.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard.component').then(
            m => m.DashboardComponent
          )
      }
    ]
  }
];