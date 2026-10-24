import { normalizeHoaTerms, projectHoaValidationTerms, sellerReportsNoHoa, NO_HOA_SELLER_STATEMENT, type HoaApplicabilityPolicy } from '../../../core/domains/offers/hoa-applicability-policy';
import type { StateOfferPackage } from './models/state-offer-package';
import type { OfferQuestionDefinition } from './models/offer-question-definition';
/** Applied by each state package; shared components do not interpret state term paths. */
export function withHoaOfferPolicy<T extends {readonly stateCode:string},C extends string>(statePackage:StateOfferPackage<T,C>,policy:HoaApplicabilityPolicy):StateOfferPackage<T,C> {
  const prepare=(terms:T)=>normalizeHoaTerms(statePackage.prepareTerms ? statePackage.prepareTerms(terms) : terms,policy);
  return {...statePackage,hoaPolicyIntegrated:true,prepareTerms:prepare,
    createInitialTerms:input=>prepare(statePackage.createInitialTerms(input)),
    validate:(terms,buyers,sellers,context)=>statePackage.validate(projectHoaValidationTerms(prepare(terms),policy),buyers,sellers,context),
    getSections:terms=>{
      const prepared=prepare(terms);
      const lockSellerFact=(rows:readonly OfferQuestionDefinition[])=>rows.map(q=>{
        if(q.fieldPath && q.fieldPath===policy.sellerFactPath)return {...q,readOnly:true};
        if(q.fieldPath===policy.documentStatusPath && q.type==='single_choice' && !sellerReportsNoHoa(prepared,policy))return {...q,options:q.options.filter(option=>!/^seller reports no (?:homeowners? |owners? )?association\.?$/i.test(option.label.trim()))};
        return q;
      });
      const sections=statePackage.getSections(prepared).map(section=>({...section,questions:lockSellerFact(section.questions),...(section.questionGroups ? {questionGroups:section.questionGroups.map(group=>({...group,questions:lockSellerFact(group.questions)}))} : {})}));
      if(!sellerReportsNoHoa(prepared,policy))return sections;
      let statementShown=false;
      const questions=(rows:readonly OfferQuestionDefinition[]):OfferQuestionDefinition[]=>rows.flatMap(question=>{
        if(question.fieldPath && (question.fieldPath===policy.sellerFactPath || question.fieldPath===policy.documentStatusPath)) {
          if(statementShown)return [];
          statementShown=true;
          return [{id:question.id,type:'information' as const,label:NO_HOA_SELLER_STATEMENT,readOnly:true}];
        }
        return [question];
      });
      return sections.map(section=>({...section,questions:questions(section.questions),
        ...(section.questionGroups ? {questionGroups:section.questionGroups.map(group=>({...group,questions:questions(group.questions)}))} : {})}));
    },
  };
}
