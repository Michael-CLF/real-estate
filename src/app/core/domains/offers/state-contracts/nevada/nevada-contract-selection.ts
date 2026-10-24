export type NevadaSelectedContract = 'navstreet_nevada_residential_sale_2026' | 'navstreet_nevada_condominium_resale_2026';
export interface NevadaOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectNevadaContract(type: string, facts?: NevadaOwnershipFacts | null): NevadaSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Nevada agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Nevada agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_nevada_condominium_resale_2026' : 'navstreet_nevada_residential_sale_2026';
}
export function isNevadaContractCompatible(contract: string, type: string, facts?: NevadaOwnershipFacts | null): boolean {
 // Preserve the original scope of residential snapshots created before ownership facts existed.
 if (contract === 'navstreet_nevada_residential_sale_2026' && !facts) return ['single_family','townhome','pud'].includes(type);
 try { return selectNevadaContract(type,facts) === contract; } catch { return false; }
}
