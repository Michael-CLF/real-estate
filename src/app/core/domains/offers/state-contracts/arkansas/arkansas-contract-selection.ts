export type ArkansasSelectedContract = 'navstreet_arkansas_residential_sale_2026' | 'navstreet_arkansas_condominium_resale_2026';
export interface ArkansasOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectArkansasContract(type: string, facts?: ArkansasOwnershipFacts | null): ArkansasSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Arkansas agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Arkansas agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_arkansas_condominium_resale_2026' : 'navstreet_arkansas_residential_sale_2026';
}
export function isArkansasContractCompatible(contract: string, type: string, facts?: ArkansasOwnershipFacts | null): boolean {
 // Preserve the original scope of residential snapshots created before ownership facts existed.
 if (contract === 'navstreet_arkansas_residential_sale_2026' && !facts) return ['single_family','townhome','pud'].includes(type);
 try { return selectArkansasContract(type,facts) === contract; } catch { return false; }
}
