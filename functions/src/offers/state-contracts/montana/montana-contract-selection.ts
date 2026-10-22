export type MontanaSelectedContract = 'navstreet_montana_residential_sale_2026' | 'navstreet_montana_condominium_resale_2026';
export interface MontanaOwnershipFacts { isCondominium?: boolean | null; isDeveloperSale?: boolean | null; isLeasehold?: boolean | null; }
export function selectMontanaContract(type: string, facts?: MontanaOwnershipFacts | null): MontanaSelectedContract {
  if (!facts || [facts.isCondominium, facts.isDeveloperSale, facts.isLeasehold].some(v => typeof v !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
  if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer and leasehold sales require a separate Montana agreement.');
  if (!['single_family', 'townhome', 'pud', 'condo'].includes(type)) throw new Error('This property type requires a separate Montana agreement.');
  if (type === 'condo' && facts.isCondominium === false) throw new Error('Correct the conflicting condominium ownership facts on the listing.');
  return facts.isCondominium ? 'navstreet_montana_condominium_resale_2026' : 'navstreet_montana_residential_sale_2026';
}
export function isMontanaContractCompatible(contract: string, type: string, facts?: MontanaOwnershipFacts | null): boolean {
  // Existing residential versions without ownership snapshots retain their identity.
  if (contract === 'navstreet_montana_residential_sale_2026' && !facts) return ['single_family', 'townhome', 'pud'].includes(type);
  try { return selectMontanaContract(type, facts) === contract; } catch { return false; }
}
