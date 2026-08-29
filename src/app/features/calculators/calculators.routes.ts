import {
  Routes
} from '@angular/router';

import {
  PublicLayoutComponent
} from '../../layout/layouts/public-layout/public-layout.component';

import {
  authGuard
} from '../../core/authentication/guards/auth.guard';

import {
  accountGuard
} from '../../core/authentication/guards/account.guard';

export const CALCULATOR_ROUTES:
  Routes = [
    {
      path: '',

      component:
        PublicLayoutComponent,

      canActivate: [
        authGuard,
        accountGuard
      ],

      children: [
        {
          path: '',
          pathMatch: 'full',

          loadComponent: () =>
            import(
              './calculators.component'
            ).then(
              component =>
                component
                  .CalculatorsComponent
            )
        },

        {
          path: 'mortgage-payment',

          loadComponent: () =>
            import(
              './components/mortgage-payment-calculator/mortgage-payment-calculator.component'
            ).then(
              component =>
                component
                  .MortgagePaymentCalculatorComponent
            )
        },

        {
          path: 'affordability',

          loadComponent: () =>
            import(
              './components/affordability-calculator/affordability-calculator.component'
            ).then(
              component =>
                component
                  .AffordabilityCalculatorComponent
            )
        },

        {
          path: 'interest-only',

          loadComponent: () =>
            import(
              './components/interest-only-calculator/interest-only-calculator.component'
            ).then(
              component =>
                component
                  .InterestOnlyCalculatorComponent
            )
        },

        {
          path: 'balloon-payment',

          loadComponent: () =>
            import(
              './components/balloon-payment-calculator/balloon-payment-calculator.component'
            ).then(
              component =>
                component
                  .BalloonPaymentCalculatorComponent
            )
        },

        {
          path: 'loan-to-value',

          loadComponent: () =>
            import(
              './components/loan-to-value-calculator/loan-to-value-calculator.component'
            ).then(
              component =>
                component
                  .LoanToValueCalculatorComponent
            )
        },

        {
          path: 'extra-payment',

          loadComponent: () =>
            import(
              './components/extra-payment-calculator/extra-payment-calculator.component'
            ).then(
              component =>
                component
                  .ExtraPaymentCalculatorComponent
            )
        },

        {
          path: '**',
          redirectTo: ''
        }
      ]
    }
  ];