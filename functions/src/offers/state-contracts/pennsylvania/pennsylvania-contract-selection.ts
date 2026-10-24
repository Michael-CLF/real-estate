export type PennsylvaniaSelectedContract = 'navstreet_pennsylvania_residential_sale_2026' | 'navstreet_pennsylvania_condominium_resale_2026';
export interface PennsylvaniaOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectPennsylvaniaContract(type: string, facts?: PennsylvaniaOwnershipFacts | null): PennsylvaniaSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Pennsylvania agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Pennsylvania agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_pennsylvania_condominium_resale_2026' : 'navstreet_pennsylvania_residential_sale_2026';
}
export function isPennsylvaniaContractCompatible(contract: string, type: string, facts?: PennsylvaniaOwnershipFacts | null): boolean {
 // Preserve the original scope of residential snapshots created before ownership facts existed.
 if (contract === 'navstreet_pennsylvania_residential_sale_2026' && !facts) return ['single_family','townhome','pud'].includes(type);
 try { return selectPennsylvaniaContract(type,facts) === contract; } catch { return false; }
}
