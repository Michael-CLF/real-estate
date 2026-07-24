import {
  ChangeDetectionStrategy,
  Component,
  computed,
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink
  ],
  selector: 'app-state-page',
  standalone: true,
  styleUrl: './state-page.component.scss',
  templateUrl: './state-page.component.html'
})
export class StatePageComponent {
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly stateSlug = toSignal(
    this.activatedRoute.paramMap.pipe(
      map((parameters) => parameters.get('stateSlug') ?? '')
    ),
    {
      initialValue: ''
    }
  );

  protected readonly state = computed<StateConfiguration | undefined>(
    () =>
      STATES.find(
        (state) => state.slug === this.stateSlug()
      )
  );
}