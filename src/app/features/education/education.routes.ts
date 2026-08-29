import {
  Routes
} from '@angular/router';

import {
  PublicLayoutComponent
} from '../../layout/layouts/public-layout/public-layout.component';

export const EDUCATION_ROUTES:
  Routes = [
    {
      path: '',

      component:
        PublicLayoutComponent,

      children: [
        /*
         * Education Center homepage
         */
        {
          path: '',
          pathMatch: 'full',

          loadComponent: () =>
            import(
              './pages/education-center/education-center.component'
            ).then(
              component =>
                component
                  .EducationCenterComponent
            )
        },

        /*
         * Individual article must remain above the
         * category-only route.
         */
        {
          path:
            ':categorySlug/:articleSlug',

          loadComponent: () =>
            import(
              './pages/education-article/education-article.component'
            ).then(
              component =>
                component
                  .EducationArticleComponent
            )
        },

        {
          path:
            ':categorySlug',

          loadComponent: () =>
            import(
              './pages/education-center/education-center.component'
            ).then(
              component =>
                component
                  .EducationCenterComponent
            )
        },

        {
          path: '**',
          redirectTo: ''
        }
      ]
    }
  ];