import type { OfferParty } from '../../../../../core/domains/offers/models/offer-party.model';
import type { OfferValidationContext, OfferValidationIssue, OfferValidationResult } from '../../../../../core/domains/offers/models/offer-validation.model';
import type { StateOfferValidator } from '../../../../../core/domains/offers/state-contracts/state-offer-validator';
import type { ColoradoOfferTerms } from '../../../../../core/domains/offers/state-contracts/colorado/models/colorado-offer-terms.model';
import { coloradoTermIssues } from '../../../../../core/domains/offers/state-contracts/colorado/services/colorado-terms-rules';
export class ColoradoOfferValidator implements StateOfferValidator<ColoradoOfferTerms> {
 readonly stateCode='CO' as const;
 validate(t:ColoradoOfferTerms,buyers:OfferParty[],sellers:OfferParty[],context:OfferValidationContext): OfferValidationResult {
  const errors:OfferValidationIssue[]=[];
  const error=(fieldPath:string,message:string)=>errors.push({fieldPath,message,severity:'error'});
  if(t.stateCode!=='CO'||t.contractType!=='navstreet_colorado_residential_2026'||t.property.state!=='CO'||!['single_family','townhome','condo'].includes(t.property.propertyType))error('form','Choose a Colorado resale home and the NavStreet Colorado agreement.');
  if(!t.legalDescription?.trim())error('legalDescription','The seller must enter the legal description in the listing.');
  for(const [side,parties] of [['buyers',buyers],['sellers',sellers]] as const){
   if(!parties.length)error(side,`Identify at least one ${side==='buyers'?'buyer':'seller'}.`);
   parties.forEach((party,index)=>{if(!party.legalName?.trim())error(`${side}.${index}.legalName`,'Enter a legal name.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email?.trim()??''))error(`${side}.${index}.email`,'Enter a valid email.');if(!party.phone?.trim())error(`${side}.${index}.phone`,'Enter a phone number.');});
  }
  for (const issue of coloradoTermIssues(t)) error(issue.fieldPath, issue.message);
  if(t.delivery.electronicDeliveryAuthorized!==true)error('delivery.electronicDeliveryAuthorized','Authorize electronic delivery.');if(!Number.isFinite(Date.parse(t.delivery.expiresAt))||(context.mode!=='draft'&&Date.parse(t.delivery.expiresAt)<=(context.currentDateTime??new Date()).getTime()))error('delivery.expiresAt','Choose a future expiration.');
  return {valid:errors.length===0,errors,warnings:[]};
 }
}