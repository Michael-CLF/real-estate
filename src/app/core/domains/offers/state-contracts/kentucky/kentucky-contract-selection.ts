export type KentuckySelectedContract = 'navstreet_kentucky_residential_sale_2026' | 'navstreet_kentucky_condominium_resale_2026';
export interface KentuckyOwnershipFacts { readonly isCondominium?: boolean | null; readonly isDeveloperSale?: boolean | null; readonly isLeasehold?: boolean | null; }
export function selectKentuckyContract(type: string, facts?: KentuckyOwnershipFacts | null): KentuckySelectedContract {
 if (!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value => typeof value !== 'boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if (facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer, new-construction and leasehold sales need a separate Kentucky agreement.');
 if (!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Kentucky agreement.');
 if (type === 'condo' && !facts.isCondominium) throw new Error('Correct the conflicting condominium ownership facts in Edit listing.');
 return facts.isCondominium ? 'navstreet_kentucky_condominium_resale_2026' : 'navstreet_kentucky_residential_sale_2026';
}
export function isKentuckyContractCompatible(contract: string, type: string, facts?: KentuckyOwnershipFacts | null): boolean {
 try { return selectKentuckyContract(type,facts) === contract; } catch { return false; }
}
