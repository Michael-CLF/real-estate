import {
  RenderMode,
  ServerRoute
} from '@angular/ssr';

import {
  STATES
} from './core/configuration/states.config';
import snapshot from './core/domains/marketplace/public-listings.snapshot.json';

export const serverRoutes: ServerRoute[] = [
  /*
   * Homepage
   */
  {
    path: '',
    renderMode: RenderMode.Prerender
  },

  /*
   * Public marketplace (first page, no query parameters)
   */
  {
    path: 'homes',
    renderMode: RenderMode.Prerender
  },

  /*
   * Build-time public inventory determines the number of crawlable pages.
   * Page one remains /homes/; subsequent pages have their own URLs.
   */
  {
    path: 'homes/page/:pageNumber',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const count = snapshot.listings.length;
      const pages = Math.ceil(count / 12);
      return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({
        pageNumber: String(i + 2)
      }));
    }
  },

  /*
   * Public informational pages
   */
  /*
 * SEO Landing Pages — Seller Acquisition
 *
 * Prerender these pages so search engines
 * receive their content in the initial HTML.
 */
  {
    path: 'list-house-for-sale-by-owner',
    renderMode: RenderMode.Prerender
  },
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
  {
    path: 'calculators/commission-savings',
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