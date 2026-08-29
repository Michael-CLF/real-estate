import {
  Routes
} from '@angular/router';

export const routes:
  Routes = [
    /*
     * Administration
     *
     * Loaded only when an administration URL is visited.
     */
    {
      path: 'administration',

      loadChildren: () =>
        import(
          './features/administration/administration.routes'
        ).then(
          routeConfiguration =>
            routeConfiguration
              .ADMINISTRATION_ROUTES
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
          routeConfiguration =>
            routeConfiguration
              .DASHBOARD_ROUTES
        )
    },

    /*
     * Seller listing creation and management
     */
    {
      path: 'sell',

      loadChildren: () =>
        import(
          './features/sell/sell.routes'
        ).then(
          routeConfiguration =>
            routeConfiguration
              .SELL_ROUTES
        )
    },

    /*
     * Authenticated calculators
     */
    {
      path: 'calculators',

      loadChildren: () =>
        import(
          './features/calculators/calculators.routes'
        ).then(
          routeConfiguration =>
            routeConfiguration
              .CALCULATOR_ROUTES
        )
    },

    /*
     * Public Education Center
     */
    {
      path: 'education',

      loadChildren: () =>
        import(
          './features/education/education.routes'
        ).then(
          routeConfiguration =>
            routeConfiguration
              .EDUCATION_ROUTES
        )
    },

    /*
     * Remaining public NavStreet routes
     *
     * This empty-prefix route must remain below every
     * specifically prefixed feature route.
     */
    {
      path: '',

      loadChildren: () =>
        import(
          './routes/public-site.routes'
        ).then(
          routeConfiguration =>
            routeConfiguration
              .PUBLIC_SITE_ROUTES
        )
    },

    /*
     * Application-wide fallback
     *
     * This must remain the final route.
     */
    {
      path: '**',
      redirectTo: ''
    }
  ];