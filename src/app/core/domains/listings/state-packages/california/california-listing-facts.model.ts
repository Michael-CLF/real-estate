export const CALIFORNIA_DISCLOSURE_TYPES = [
  'california-transfer-disclosure', 'california-natural-hazard-disclosure',
  'california-fire-hardening', 'california-defensible-space',
  'california-recent-renovations', 'california-assisted-water-tank',
  'california-association-documents', 'california-local-disclosures',
  'california-safety-compliance', 'lead-based-paint',
  'california-earthquake-environmental-guides',
] as const;
export type CaliforniaDisclosureType = typeof CALIFORNIA_DISCLOSURE_TYPES[number];
export interface CaliforniaDisclosureDecision {
  status: 'required' | 'exempt' | 'not_applicable';
  basis: string;
}
export type CaliforniaDisclosureApplicability = Partial<Record<CaliforniaDisclosureType, CaliforniaDisclosureDecision>>;
export function validCaliforniaDisclosureDecision(value: unknown): value is CaliforniaDisclosureDecision {
  if (!value || typeof value !== 'object') return false;
  const d = value as CaliforniaDisclosureDecision;
  return ['required', 'exempt', 'not_applicable'].includes(d.status) &&
    typeof d.basis === 'string' && d.basis.length <= 5000 &&
    (d.status === 'required' || d.basis.trim().length > 0);
}
/** Uploads count as applicable unless the seller records an explained exemption. */
export function californiaDisclosureOutstanding(
  decisions: CaliforniaDisclosureApplicability | undefined,
  uploaded: ReadonlySet<string>,
): string[] {
  return CALIFORNIA_DISCLOSURE_TYPES.filter(type => {
    const decision = decisions?.[type];
    if (!validCaliforniaDisclosureDecision(decision)) return !uploaded.has(type);
    return decision.status === 'required' && !uploaded.has(type);
  });
}

export interface CaliforniaListingFacts {
  readonly disclosureApplicability?: CaliforniaDisclosureApplicability;
  readonly transferDisclosure: 'required' | 'exempt' | 'unselected';
  readonly transferExemptionBasis: string;
  readonly naturalHazardDisclosure: 'required' | 'exempt' | 'unselected';
  readonly naturalHazardExemptionBasis: string;
  readonly fireHazardZone: 'high' | 'very_high' | 'other' | 'unknown' | 'unselected';
  readonly resaleWithin18Months: 'yes' | 'no' | 'unknown' | 'unselected';
  readonly assistedWaterTank: 'yes' | 'no' | 'unknown' | 'unselected';
  readonly gasApplianceRestrictions: string;
}
export const CALIFORNIA_LISTING_FACT_DEFAULTS: CaliforniaListingFacts = {
  transferDisclosure: 'unselected', transferExemptionBasis: '',
  naturalHazardDisclosure: 'unselected', naturalHazardExemptionBasis: '',
  fireHazardZone: 'unselected', resaleWithin18Months: 'unselected',
  assistedWaterTank: 'unselected', gasApplianceRestrictions: '',
};