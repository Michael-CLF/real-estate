export type IllinoisSelectedContract = 'navstreet_illinois_residential_sale_2026' | 'navstreet_illinois_condominium_resale_2026';
export interface IllinoisOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectIllinoisContract(type: string, facts?: IllinoisOwnershipFacts | null): IllinoisSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Illinois agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Illinois agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_illinois_condominium_resale_2026' : 'navstreet_illinois_residential_sale_2026';
}
export function isIllinoisContractCompatible(contract: string, type: string, facts?: IllinoisOwnershipFacts | null): boolean {
 // Preserve the original scope of residential snapshots created before ownership facts existed.
 if (contract === 'navstreet_illinois_residential_sale_2026' && !facts) return ['single_family','townhome','pud'].includes(type);
 try { return selectIllinoisContract(type,facts) === contract; } catch { return false; }
}
