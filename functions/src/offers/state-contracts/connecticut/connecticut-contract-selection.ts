export type ConnecticutSelectedContract = 'navstreet_connecticut_residential_sale_2026' | 'navstreet_connecticut_condominium_resale_2026';
export interface ConnecticutOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectConnecticutContract(type: string, facts?: ConnecticutOwnershipFacts | null): ConnecticutSelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Connecticut agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Connecticut agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_connecticut_condominium_resale_2026' : 'navstreet_connecticut_residential_sale_2026';
}
export function isConnecticutContractCompatible(contract: string, type: string, facts?: ConnecticutOwnershipFacts | null): boolean {
 try { return selectConnecticutContract(type,facts) === contract; } catch { return false; }
}
