import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject
} from '@angular/core';

import {
  toSignal
} from '@angular/core/rxjs-interop';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  map
} from 'rxjs';

import {
  STATES,
  StateConfiguration
} from '../../../core/configuration/states.config';

import {
  PageSeoService
} from '../../../core/seo/page-seo.service';

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink
  ],
  selector: 'app-state-page',
  standalone: true,
  styleUrl: './state-page.component.scss',
  templateUrl: './state-page.component.html'
})
export class StatePageComponent {
  private readonly activatedRoute =
    inject(ActivatedRoute);

  private readonly pageSeo =
    inject(PageSeoService);

  private readonly stateSlug = toSignal(
    this.activatedRoute.paramMap.pipe(
      map(parameters =>
        parameters.get('stateSlug') ?? ''
      )
    ),
    {
      initialValue: ''
    }
  );

  protected readonly state =
    computed<StateConfiguration | undefined>(() =>
      STATES.find(state =>
        state.slug === this.stateSlug()
      )
    );

  constructor() {
    effect(() => {
      const state = this.state();

      if (!state?.isActive) {
        this.pageSeo.set(
          'State Marketplace Coming Soon | NavStreet',
          'NavStreet is expanding into additional states.',
          true
        );
        return;
      }

      this.pageSeo.set(
        `${state.name} For Sale By Owner (FSBO) | NavStreet`,
        `Sell your ${state.name} home for just $49 with NavStreet. List your property, access marketing tools, and connect directly with buyers without a listing agent.`
      );
    });
  }
}