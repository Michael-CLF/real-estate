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

import { getStateDisclosureRequirements } from '../../../core/configuration/state-disclosures.config';

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

  protected readonly disclosureTopics = computed(() => {
    const selectedState = this.state();
    if (!selectedState?.isActive) return [];
    return getStateDisclosureRequirements(selectedState.abbreviation)
      .filter(item => item.documentType !== 'lead-based-paint')
      .slice(0, 5);
  });

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
        `Homes for Sale by Owner in ${state.name} | NavStreet`,
        `Browse homes for sale by owner in ${state.name}, connect directly with homeowners, or list your property on NavStreet for just $49.`
      );
    });
  }
}