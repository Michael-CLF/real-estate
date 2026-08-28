import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';

import {
  JourneyStep
} from '../../models/how-navstreet-works.models';

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,

  selector:
    'app-journey-timeline',

  standalone:
    true,

  styleUrl:
    './journey-timeline.component.scss',

  templateUrl:
    './journey-timeline.component.html'
})
export class JourneyTimelineComponent {

  readonly description =
    input.required<string>();

  readonly eyebrow =
    input.required<string>();

  readonly sectionId =
    input.required<string>();

  readonly steps =
    input.required<
      readonly JourneyStep[]
    >();

  readonly title =
    input.required<string>();

}