import {
  Routes
} from '@angular/router';

export const MARKETPLACE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',

    loadComponent: () =>
      import(
        './search/pages/search-results/search-results.component'
      ).then(
        component =>
          component.SearchResultsComponent
      )
  }
];