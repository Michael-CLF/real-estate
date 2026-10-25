export type VirginiaSelectedContract = 'navstreet_virginia_residential_sale_2026' | 'navstreet_virginia_condominium_resale_2026';
export interface VirginiaOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectVirginiaContract(type: string, facts?: VirginiaOwnershipFacts | null): VirginiaSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Virginia agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Virginia agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_virginia_condominium_resale_2026' : 'navstreet_virginia_residential_sale_2026';
}
export function isVirginiaContractCompatible(contract: string, type: string, facts?: VirginiaOwnershipFacts | null): boolean {
 try { return selectVirginiaContract(type,facts) === contract; } catch { return false; }
}
