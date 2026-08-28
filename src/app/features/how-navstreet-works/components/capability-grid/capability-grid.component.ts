import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';

import {
  CapabilitySection
} from '../../models/how-navstreet-works.models';

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,

  selector:
    'app-capability-grid',

  standalone:
    true,

  styleUrl:
    './capability-grid.component.scss',

  templateUrl:
    './capability-grid.component.html'
})
export class CapabilityGridComponent {

  readonly section =
    input.required<CapabilitySection>();

}