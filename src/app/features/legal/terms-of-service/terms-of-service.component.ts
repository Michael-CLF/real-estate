import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  NAVSTREET_LEGAL_EFFECTIVE_DATE,
  NAVSTREET_TERMS_VERSION
} from '../../../core/legal/legal-document-versions';

import {
  PageSeoService
} from '../../../core/seo/page-seo.service';

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

  private readonly pageSeo =
    inject(PageSeoService);

  protected readonly effectiveDate =
    NAVSTREET_LEGAL_EFFECTIVE_DATE;

  protected readonly termsVersion =
    NAVSTREET_TERMS_VERSION;

  constructor() {
    this.pageSeo.set(
      'Terms of Service | NavStreet',
      'Read the NavStreet Terms of Service, including the terms and conditions governing use of our real estate marketplace.'
    );
  }
}