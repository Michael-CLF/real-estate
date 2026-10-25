export type AlaskaSelectedContract = 'navstreet_alaska_residential_sale_2026' | 'navstreet_alaska_condominium_resale_2026';
export interface AlaskaOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectAlaskaContract(type: string, facts?: AlaskaOwnershipFacts | null): AlaskaSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Alaska agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Alaska agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_alaska_condominium_resale_2026' : 'navstreet_alaska_residential_sale_2026';
}
export function isAlaskaContractCompatible(contract: string, type: string, facts?: AlaskaOwnershipFacts | null): boolean {
 try { return selectAlaskaContract(type,facts) === contract; } catch { return false; }
}
