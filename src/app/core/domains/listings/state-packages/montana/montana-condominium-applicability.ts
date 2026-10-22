/** Ownership facts take precedence over the property's physical appearance or HOA fees. */
export function isMontanaCondominiumListing(facts: {readonly propertyType?: string | null; readonly contractFacts?: {readonly isCondominium?: boolean | null}}): boolean {
 return facts.contractFacts?.isCondominium === true || facts.propertyType === 'condo';
}
