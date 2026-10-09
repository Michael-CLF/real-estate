import type { FormBuilder } from '@angular/forms';
import { CALIFORNIA_LISTING_FACT_DEFAULTS } from './california-listing-facts.model';

/** The existing controls stay at sellerStatements.california. */
export function createCaliforniaListingFactsForm(fb: FormBuilder) {
  return fb.nonNullable.group({
    transferDisclosure: [String(CALIFORNIA_LISTING_FACT_DEFAULTS.transferDisclosure)],
    transferExemptionBasis: [CALIFORNIA_LISTING_FACT_DEFAULTS.transferExemptionBasis],
    naturalHazardDisclosure: [String(CALIFORNIA_LISTING_FACT_DEFAULTS.naturalHazardDisclosure)],
    naturalHazardExemptionBasis: [CALIFORNIA_LISTING_FACT_DEFAULTS.naturalHazardExemptionBasis],
    fireHazardZone: [String(CALIFORNIA_LISTING_FACT_DEFAULTS.fireHazardZone)],
    resaleWithin18Months: [String(CALIFORNIA_LISTING_FACT_DEFAULTS.resaleWithin18Months)],
    assistedWaterTank: [String(CALIFORNIA_LISTING_FACT_DEFAULTS.assistedWaterTank)],
    gasApplianceRestrictions: [CALIFORNIA_LISTING_FACT_DEFAULTS.gasApplianceRestrictions],
  });
}
