import { Routes } from '@angular/router';
import { AuthenticatedLayoutComponent } from '../../layout/layouts/authenticated-layout/authenticated-layout.component';

export const SELLER_ROUTES: Routes = [
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/pages/seller-dashboard/seller-dashboard.component').then(
            m => m.SellerDashboardComponent
          )
      }
    ]
  }
];