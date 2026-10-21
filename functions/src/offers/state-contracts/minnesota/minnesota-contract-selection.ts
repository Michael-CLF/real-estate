export type MinnesotaSelectedContract = 'navstreet_minnesota_residential_sale_2026' | 'navstreet_minnesota_condominium_resale_2026';
export interface MinnesotaOwnershipFacts {isCondominium?:boolean|null;isDeveloperSale?:boolean|null;isLeasehold?:boolean|null;}
export function selectMinnesotaContract(type:string,facts?:MinnesotaOwnershipFacts|null):MinnesotaSelectedContract {
 if(!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value=>typeof value!=='boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if(facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer and leasehold sales need a separate Minnesota agreement.');
 if(!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Minnesota agreement.');
 if(type==='condo' && !facts.isCondominium) throw new Error('Confirm condominium ownership on the listing.');
 return facts.isCondominium ? 'navstreet_minnesota_condominium_resale_2026' : 'navstreet_minnesota_residential_sale_2026';
}
export function isMinnesotaContractCompatible(contract:string,type:string,facts?:MinnesotaOwnershipFacts|null):boolean {
 if(contract==='navstreet_minnesota_residential_sale_2026' && !facts) return ['single_family','townhome','pud'].includes(type);
 try {return selectMinnesotaContract(type,facts)===contract;}catch{return false;}
}
export const MINNESOTA_CONDOMINIUM_TERMS = {projectName:'',unitDesignation:'',commonElements:'',parkingStorage:'',rightsAcknowledged:null as boolean|null};
