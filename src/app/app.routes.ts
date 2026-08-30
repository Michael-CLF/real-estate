import {
  Routes
} from '@angular/router';

export const routes: Routes = [
  /*
   * Administration
   */
  {
    path: 'administration',

    loadChildren: () =>
      import(
        './features/administration/administration.routes'
      ).then(
        routes =>
          routes.ADMINISTRATION_ROUTES
      )
  },

  /*
   * Authenticated account dashboard
   */
  {
    path: 'dashboard',

    loadChildren: () =>
      import(
        './features/dashboard/dashboard.routes'
      ).then(
        routes =>
          routes.DASHBOARD_ROUTES
      )
  },

  /*
   * Seller workspace
   */
  {
    path: 'sell',

    loadChildren: () =>
      import(
        './features/sell/sell.routes'
      ).then(
        routes =>
          routes.SELL_ROUTES
      )
  },

  /*
   * Public website and account-entry routes
   */
  {
    path: '',

    loadChildren: () =>
      import(
        './routes/public.routes'
      ).then(
        routes =>
          routes.PUBLIC_ROUTES
      )
  },

  /*
   * Global fallback
   */
  {
    path: '**',
    redirectTo: ''
  }
];