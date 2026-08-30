import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  AudiencePath
} from '../../models/how-navstreet-works.models';

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,

  selector:
    'app-audience-path',

  standalone:
    true,

  imports: [
    RouterLink
  ],

  styleUrl:
    './audience-path.component.scss',

  templateUrl:
    './audience-path.component.html'
})
export class AudiencePathComponent {

  readonly paths =
    input.required<
      readonly AudiencePath[]
    >();

  readonly pathSelected =
    output<AudiencePath>();

  protected selectPath(
    path: AudiencePath
  ): void {

    this.pathSelected.emit(path);
  }
}