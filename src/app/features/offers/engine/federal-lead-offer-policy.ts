import { isFederalLeadExcluded, normalizeFederalLeadTerms, type FederalLeadTermPolicy } from '../../../core/domains/offers/federal-lead-policy';
import type { StateOfferPackage } from './models/state-offer-package';
/** State packages supply their own field mapping; the shell never reads state term paths. */
export function withFederalLeadOfferPolicy<T extends {readonly stateCode:string}, C extends string>(statePackage:StateOfferPackage<T,C>,policy:FederalLeadTermPolicy):StateOfferPackage<T,C> {
  const prepare=(terms:T)=>normalizeFederalLeadTerms(terms,policy);
  return {...statePackage,prepareTerms:prepare,
    createInitialTerms:input=>prepare(statePackage.createInitialTerms(input)),
    validate:(terms,buyers,sellers,context)=>statePackage.validate(prepare(terms),buyers,sellers,context),
    getSections:terms=>{
      const sections=statePackage.getSections(prepare(terms));
      const property=(terms as unknown as {property?:{yearBuilt?:unknown;propertyType?:unknown}}).property;
      if(!property || !isFederalLeadExcluded(property))return sections;
      return sections.map(section=>({...section,questions:section.questions.filter(q=>!q.fieldPath || !policy.hiddenFields.includes(q.fieldPath)).map(q=>{
        if(!policy.addendum || q.fieldPath!==policy.addendum.path || !('options' in q))return q;
        return {...q,options:q.options.filter(option=>option.value!==policy.addendum!.id)};
      })}));
    },
  };
}
