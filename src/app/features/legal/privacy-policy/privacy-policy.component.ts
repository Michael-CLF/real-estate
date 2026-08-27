import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';

import {
  NAVSTREET_LEGAL_EFFECTIVE_DATE,
  NAVSTREET_PRIVACY_VERSION
} from '../../../core/legal/legal-document-versions';

@Component({
  selector:
    'app-privacy-policy',

  standalone:
    true,

  imports: [],

  templateUrl:
    './privacy-policy.component.html',

  styleUrl:
    './privacy-policy.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class PrivacyPolicyComponent {

  protected readonly effectiveDate =
    NAVSTREET_LEGAL_EFFECTIVE_DATE;

  protected readonly privacyVersion =
    NAVSTREET_PRIVACY_VERSION;
}