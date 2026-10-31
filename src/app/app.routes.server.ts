import {
  RenderMode,
  ServerRoute
} from '@angular/ssr';

import {
  STATES
} from './core/configuration/states.config';

export const serverRoutes: ServerRoute[] = [
  /*
   * Homepage
   */
  {
    path: '',
    renderMode: RenderMode.Prerender
  },

  /*
   * Public informational pages
   */
  {
    path: 'how-navstreet-works',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'pricing',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'faq',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'contact',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'terms',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'privacy',
    renderMode: RenderMode.Prerender
  },

  /*
   * Public calculator pages
   */
  {
    path: 'calculators',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'calculators/mortgage-payment',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'calculators/affordability',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'calculators/interest-only',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'calculators/balloon-payment',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'calculators/loan-to-value',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'calculators/extra-payment',
    renderMode: RenderMode.Prerender
  },

  /*
   * Active state landing pages
   */
  {
    path: 'states/:stateSlug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return STATES
        .filter(state => state.isActive)
        .map(state => ({
          stateSlug: state.slug
        }));
    }
  },

  /*
   * All other routes remain client-rendered.
   * This includes authentication, dashboards,
   * listings, and offer workflows.
   */
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];