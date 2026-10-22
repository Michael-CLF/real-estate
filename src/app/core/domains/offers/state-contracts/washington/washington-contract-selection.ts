export type WashingtonSelectedContract = 'navstreet_washington_residential_sale_2026' | 'navstreet_washington_condominium_resale_2026';
export interface WashingtonOwnershipFacts { isCondominium?: boolean | null; isDeveloperSale?: boolean | null; isLeasehold?: boolean | null; }
export function selectWashingtonContract(type: string, facts?: WashingtonOwnershipFacts | null): WashingtonSelectedContract {
  if (!facts || [facts.isCondominium, facts.isDeveloperSale, facts.isLeasehold].some(v => typeof v !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
  if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer and leasehold sales require a separate Washington agreement.');
  if (!['single_family', 'townhome', 'pud', 'condo'].includes(type)) throw new Error('This property type requires a separate Washington agreement.');
  if (type === 'condo' && facts.isCondominium === false) throw new Error('Correct the conflicting condominium ownership facts on the listing.');
  return facts.isCondominium ? 'navstreet_washington_condominium_resale_2026' : 'navstreet_washington_residential_sale_2026';
}
export function isWashingtonContractCompatible(contract: string, type: string, facts?: WashingtonOwnershipFacts | null): boolean {
  // Existing residential versions without ownership snapshots retain their identity.
  if (contract === 'navstreet_washington_residential_sale_2026' && !facts) return ['single_family', 'townhome', 'pud'].includes(type);
  try { return selectWashingtonContract(type, facts) === contract; } catch { return false; }
}
