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

      this.pageSeo.set(
        state?.isActive
          ? `For Sale by Owner Homes in ${state.name} | NavStreet`
          : 'State marketplace coming soon | NavStreet',
        state?.isActive
          ? `Explore for-sale-by-owner homes and selling tools in ${state.name}.`
          : 'NavStreet is expanding into additional states.',
        !state?.isActive
      );
    });
  }
}