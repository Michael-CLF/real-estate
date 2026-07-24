import { Routes } from '@angular/router';

export const MARKETPLACE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './search/pages/search-results/search-results.component'
      ).then(component => component.SearchResultsComponent)
  }
];