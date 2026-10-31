import {
  RenderMode,
  ServerRoute
} from '@angular/ssr';

import {
  STATES
} from './core/configuration/states.config';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
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
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];