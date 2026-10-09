import type { FormBuilder } from '@angular/forms';
import type { ColoradoPropertyFacts } from '../../../offers/state-contracts/colorado/models/colorado-contract-elections';
import type { ColoradoSellerLoan } from '../../../offers/state-contracts/colorado/models/colorado-offer-terms.model';

export interface ColoradoSellerLoanFormValue extends Omit<ColoradoSellerLoan,
  'estimatedBalanceInCents' | 'principalInterestPaymentInCents'> {
  estimatedBalanceDollars: number;
  principalInterestPaymentDollars: number;
}

export const COLORADO_LISTING_OPTIONAL_FACTS = [
    {
      key: 'leasedItems',
      question: 'Is any equipment included in the sale leased?',
      detail: 'Leased equipment and lease references',
      guidance:
        'Examples include rented propane tanks, security systems or equipment. Identify the equipment and lease document.',
    },
    {
      key: 'encumberedItems',
      question:
        'Is any included equipment subject to debt or a PACE obligation?',
      detail: 'Equipment debt or PACE obligation',
      guidance:
        'Identify the equipment, outstanding obligation and relevant agreement.',
    },
    {
      key: 'solarPowerPlan',
      question: 'Is there a solar lease or power purchase agreement?',
      detail: 'Solar agreement and document reference',
      guidance:
        'Identify the provider, agreement and relevant document. Seller-owned solar equipment belongs in the included-items description.',
    },
    {
      key: 'deededWaterRights',
      question:
        'Are separately deeded water rights included with this property?',
      detail: 'Deeded water rights and their legal description',
      guidance:
        'Describe the separately deeded water rights and copy their legal description from your records. This is separate from the property legal description. Municipal water service alone does not establish separately deeded water rights.',
    },
    {
      key: 'otherWaterRights',
      question: 'Are other transferable water rights included?',
      detail: 'Other transferable water rights',
      guidance:
        'Identify the rights and supporting documents. Do not assume water utility service is a transferable water right.',
    },
    {
      key: 'wellPermit',
      question: 'Does the property use a well?',
      detail: 'Well and permit information',
      guidance:
        'Enter the permit number and identify any available permit copy. If a well exists but the permit number is unknown, state that in the details.',
    },
    {
      key: 'waterStock',
      question: 'Are water company shares included in the sale?',
      detail: 'Water company and shares',
      guidance:
        'Identify the water company, shares and supporting ownership records.',
    },
    {
      key: 'mineralRights',
      question:
        'Do your records identify mineral interests or reservations affecting the property?',
      detail: 'Known mineral interests and reservations',
      guidance:
        'Describe what your deed or other records identify. NO means no known interests or reservations are reported; it does not establish ownership or guarantee clear title.',
    },
    {
      key: 'offRecordMatters',
      question:
        'Are there known off-record title matters or existing surveys to identify?',
      detail: 'Known off-record matters and surveys',
      guidance:
        'Identify known unrecorded claims, use agreements or existing survey documents. This answer is not a title guarantee.',
    },
    {
      key: 'thirdPartyRights',
      question:
        'Does another party have an approval right, purchase option or right of first refusal?',
      detail: 'Third-party approval or purchase rights',
      guidance:
        'Identify the party, right and relevant agreement or document.',
    },
    {
      key: 'leases',
      question: 'Are there existing occupancy agreements or leases?',
      detail: 'Occupancy agreements and lease references',
      guidance:
        'Identify current rental, occupancy or lease agreements and their documents. Keep this answer consistent with Existing Leases below.',
    },
  ] as const;

export function createColoradoPropertyFactsForm(fb: FormBuilder) {
  return fb.nonNullable.group({
      includedItems: [''],
      excludedItems: [''],
      leasedItems: [''],
      encumberedItems: [''],
      solarPowerPlan: [''],
      parkingStorage: [''],
      waterSource: [''],
      deededWaterRights: [''],
      otherWaterRights: [''],
      wellPermit: [''],
      waterStock: [''],
      mineralRights: [''],
      offRecordMatters: [''],
      thirdPartyRights: [''],
      leases: [''],
      metroDistrictWebsite: [''],
      metroDistrictDisclosure: [''],
      metroDistrict: ['unselected' as ColoradoPropertyFacts['metroDistrict']],
    });
}

export function createColoradoAssumableLoanForm(fb: FormBuilder) {
  return fb.nonNullable.group({
      available: [false], ratePercent: [0],
      estimatedBalanceDollars: [0], balanceAsOf: [''],
      principalInterestPaymentDollars: [0], paymentPeriod: ['month'],
      escrowRealEstateTaxes: [false], escrowPropertyInsurance: [false],
      escrowMortgageInsurance: [false], escrowOther: [''],
    });
}

export function restoreColoradoAssumableLoan(loan: ColoradoSellerLoan | null | undefined): ColoradoSellerLoanFormValue | null {
  return loan ? {
    ...loan,
    estimatedBalanceDollars: loan.estimatedBalanceInCents / 100,
    principalInterestPaymentDollars: loan.principalInterestPaymentInCents / 100,
  } : null;
}

export function serializeColoradoAssumableLoan(stateCode: string | undefined, loan: ColoradoSellerLoanFormValue | null | undefined): ColoradoSellerLoan | undefined {
  return stateCode === 'CO' && loan?.available ? {
    available: true,
    ratePercent: loan.ratePercent,
    balanceAsOf: loan.balanceAsOf,
    estimatedBalanceInCents: Math.round(loan.estimatedBalanceDollars * 100),
    principalInterestPaymentInCents: Math.round(loan.principalInterestPaymentDollars * 100),
    paymentPeriod: loan.paymentPeriod.trim(),
    escrowRealEstateTaxes: loan.escrowRealEstateTaxes,
    escrowPropertyInsurance: loan.escrowPropertyInsurance,
    escrowMortgageInsurance: loan.escrowMortgageInsurance,
    escrowOther: loan.escrowOther.trim(),
  } : undefined;
}
