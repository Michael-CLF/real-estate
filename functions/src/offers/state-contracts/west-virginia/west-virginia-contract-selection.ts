export type WestVirginiaSelectedContract = 'navstreet_west_virginia_residential_sale_2026' | 'navstreet_west_virginia_condominium_resale_2026';
export interface WestVirginiaOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectWestVirginiaContract(type: string, facts?: WestVirginiaOwnershipFacts | null): WestVirginiaSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate West Virginia agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate West Virginia agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_west_virginia_condominium_resale_2026' : 'navstreet_west_virginia_residential_sale_2026';
}
export function isWestVirginiaContractCompatible(contract: string, type: string, facts?: WestVirginiaOwnershipFacts | null): boolean {
 try { return selectWestVirginiaContract(type,facts) === contract; } catch { return false; }
}
