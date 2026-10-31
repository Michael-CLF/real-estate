import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  NAVSTREET_LEGAL_EFFECTIVE_DATE,
  NAVSTREET_PRIVACY_VERSION
} from '../../../core/legal/legal-document-versions';

import {
  PageSeoService
} from '../../../core/seo/page-seo.service';

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

  private readonly pageSeo =
    inject(PageSeoService);

  protected readonly effectiveDate =
    NAVSTREET_LEGAL_EFFECTIVE_DATE;

  protected readonly privacyVersion =
    NAVSTREET_PRIVACY_VERSION;

  constructor() {
    this.pageSeo.set(
      'Privacy Policy | NavStreet',
      'Learn how NavStreet collects, uses, and protects personal information when you use our real estate marketplace.'
    );
  }
}