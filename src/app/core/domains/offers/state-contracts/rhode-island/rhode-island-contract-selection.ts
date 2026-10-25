export type RhodeIslandSelectedContract = 'navstreet_rhode_island_residential_sale_2026' | 'navstreet_rhode_island_condominium_resale_2026';
export interface RhodeIslandOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectRhodeIslandContract(type: string, facts?: RhodeIslandOwnershipFacts | null): RhodeIslandSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Rhode Island agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Rhode Island agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_rhode_island_condominium_resale_2026' : 'navstreet_rhode_island_residential_sale_2026';
}
export function isRhodeIslandContractCompatible(contract: string, type: string, facts?: RhodeIslandOwnershipFacts | null): boolean {
 try { return selectRhodeIslandContract(type,facts) === contract; } catch { return false; }
}
