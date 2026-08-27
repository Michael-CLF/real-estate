import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';

import {
  NAVSTREET_LEGAL_EFFECTIVE_DATE,
  NAVSTREET_TERMS_VERSION
} from '../../../core/legal/legal-document-versions';

@Component({
  selector:
    'app-terms-of-service',

  standalone:
    true,

  imports: [],

  templateUrl:
    './terms-of-service.component.html',

  styleUrl:
    './terms-of-service.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class TermsOfServiceComponent {

  protected readonly effectiveDate =
    NAVSTREET_LEGAL_EFFECTIVE_DATE;

  protected readonly termsVersion =
    NAVSTREET_TERMS_VERSION;
}