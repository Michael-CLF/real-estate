import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './layout/layouts/public-layout/public-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then(
            (component) => component.HomeComponent
          )
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/about/about.component').then(
            (component) => component.AboutComponent
          )
      },
      {
        path: 'buy',
        loadComponent: () =>
          import('./features/buy/buy.component').then(
            (component) => component.BuyComponent
          )
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/contact.component').then(
            (component) => component.ContactComponent
          )
      },
      {
        path: 'mortgage',
        loadComponent: () =>
          import('./features/mortgage/mortgage.component').then(
            (component) => component.MortgageComponent
          )
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./features/resources/resources.component').then(
            (component) => component.ResourcesComponent
          )
      },
      {
        path: 'sell',
        loadComponent: () =>
          import('./features/sell/sell.component').then(
            (component) => component.SellComponent
          )
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/authentication/pages/register/register.component').then(
            (component) => component.RegisterComponent
          )
      },
      {
        path: 'sign-in',
        loadComponent: () =>
          import('./features/authentication/pages/sign-in/sign-in.component').then(
            (component) => component.SignInComponent
          )
      },
      {
        path: 'homes',
        loadChildren: () =>
          import('./features/marketplace/marketplace.routes').then(
            (routes) => routes.MARKETPLACE_ROUTES
          )
      },
      {
        path: 'listings/:listingId',
        loadComponent: () =>
          import(
            './features/marketplace/listings/pages/listing-details/listing-details.component'
          ).then(
            (component) => component.ListingDetailsComponent
          )
      },
      {
        path: 'states/:stateSlug',
        loadComponent: () =>
          import(
            './features/states/state-page/state-page.component'
          ).then(
            (component) => component.StatePageComponent
          )
      }
    ]
  },
 {
  path: 'dashboard',
  loadChildren: () =>
    import('./features/dashboard/dashboard.routes').then(
      m => m.DASHBOARD_ROUTES
    )
},
  {
    path: '**',
    redirectTo: ''
  }
];