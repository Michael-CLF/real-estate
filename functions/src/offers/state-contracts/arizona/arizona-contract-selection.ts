export type ArizonaSelectedContract = 'navstreet_arizona_residential_sale_2026' | 'navstreet_arizona_condominium_resale_2026';
export interface ArizonaOwnershipFacts {isCondominium?:boolean|null;isDeveloperSale?:boolean|null;isLeasehold?:boolean|null;}
export function selectArizonaContract(type:string,facts?:ArizonaOwnershipFacts|null):ArizonaSelectedContract {
 if(!facts || [facts.isCondominium,facts.isDeveloperSale,facts.isLeasehold].some(value=>typeof value!=='boolean')) throw new Error('The seller must complete the ownership and sale type questions in Edit listing.');
 if(facts.isDeveloperSale || facts.isLeasehold) throw new Error('Developer and leasehold sales need a separate Arizona agreement.');
 if(!['single_family','townhome','pud','condo'].includes(type)) throw new Error('This property type needs a separate Arizona agreement.');
 if(type==='condo' && !facts.isCondominium) throw new Error('Confirm condominium ownership on the listing.');
 return facts.isCondominium ? 'navstreet_arizona_condominium_resale_2026' : 'navstreet_arizona_residential_sale_2026';
}
export function isArizonaContractCompatible(contract:string,type:string,facts?:ArizonaOwnershipFacts|null):boolean {
 if(contract==='navstreet_arizona_residential_sale_2026' && !facts) return ['single_family','townhome','pud'].includes(type);
 try {return selectArizonaContract(type,facts)===contract;}catch{return false;}
}
export const ARIZONA_CONDOMINIUM_TERMS = {projectName:'',unitDesignation:'',commonElements:'',parkingStorage:'',rightsAcknowledged:null as boolean|null};
