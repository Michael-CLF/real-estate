export type NewMexicoSelectedContract = 'navstreet_new_mexico_residential_sale_2026' | 'navstreet_new_mexico_condominium_resale_2026';
export interface NewMexicoOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectNewMexicoContract(type: string, facts?: NewMexicoOwnershipFacts | null): NewMexicoSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate New Mexico agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate New Mexico agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_new_mexico_condominium_resale_2026' : 'navstreet_new_mexico_residential_sale_2026';
}
export function isNewMexicoContractCompatible(contract: string, type: string, facts?: NewMexicoOwnershipFacts | null): boolean {
 // Preserve the original scope of residential snapshots created before ownership facts existed.
 if (contract === 'navstreet_new_mexico_residential_sale_2026' && !facts) return ['single_family','townhome','pud'].includes(type);
 try { return selectNewMexicoContract(type,facts) === contract; } catch { return false; }
}
