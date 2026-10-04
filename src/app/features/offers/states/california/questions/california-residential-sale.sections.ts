import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';
import type { OfferQuestionDefinition, OfferQuestionVisibilityRule } from '../../../engine/models/offer-question-definition';
import { CALIFORNIA_STATUTORY_NOTICES as notices } from './california-statutory-notices';
const required = {required:true,message:'Complete this answer before continuing.'};
const visible = (fieldPath:string,value:unknown=true):OfferQuestionVisibilityRule => ({match:'all',conditions:[{fieldPath,operator:'equals',value}]});
const q = (fieldPath:string,label:string,type:'text'|'textarea'|'currency'|'number'|'date'|'yes_no'|'acknowledgement',needed=true):OfferQuestionDefinition => ({id:fieldPath,type,fieldPath,label,...(needed?{validation:required}:{})});
const choice = (fieldPath:string,label:string,options:readonly {value:string;label:string}[]):OfferQuestionDefinition => ({id:fieldPath,type:'single_choice',fieldPath,label,options,validation:required});
const number = (path:string,label:string,min:number,max:number,when?:OfferQuestionVisibilityRule):OfferQuestionDefinition => ({...q(path,label,'number'),validation:{...required,minimum:min,maximum:max},...(when?{visibleWhen:when}:{})});
const money = (path:string,label:string,positive=true,when?:OfferQuestionVisibilityRule):OfferQuestionDefinition => ({...q(path,label,'currency',positive),validation:{...required,required:positive,minimum:positive?1:0},...(when?{visibleWhen:when}:{})});
const receipt = [{value:'pending',label:'Not yet received — seller will provide the applicable documents'},{value:'received',label:'I received and reviewed the uploaded document'},{value:'not_applicable',label:'Not applicable based on the seller’s property facts'},{value:'exempt',label:'Seller reports a statutory exemption — review the stated basis'}];
const allocation=[{value:'seller',label:'Seller'},{value:'buyer',label:'Buyer'},{value:'split',label:'Split equally'}];
export const CALIFORNIA_RESIDENTIAL_SALE_SECTIONS:readonly OfferSectionDefinition[]=[
 {id:'parties',title:'Buyers and sellers',questions:[]},
 {id:'property',title:'Property and included items',questions:[
  {...q('legalDescription','Seller-provided legal description (optional)','textarea',false),readOnly:true},
  q('propertyItems.included','Additional personal property included','textarea',false),
  q('propertyItems.excluded','Fixtures or personal property excluded','textarea',false),
  q('propertyItems.leasedItemsDescription','Leased equipment, solar agreements and proposed transfer arrangements','textarea',false),
 ]},
 {id:'purchase',title:'Price, deposits and financing',questions:[
  money('purchase.purchasePriceInCents','Purchase price'),
  q('purchase.hasEarnestMoney','Does this offer include an initial escrow deposit?','yes_no'),
  money('purchase.earnestMoneyInCents','Initial deposit',true,visible('purchase.hasEarnestMoney')),
  {...q('purchase.earnestMoneyHolder','Escrow holder, if already selected','text',false),visibleWhen:visible('purchase.hasEarnestMoney'),helpText:'If blank, the parties will jointly select a qualified escrow holder. NavStreet does not hold funds.'},
  number('purchase.earnestMoneyDueDays','Calendar days after acceptance to deliver the deposit',1,30,visible('purchase.hasEarnestMoney')),
  {...q('conditions.additionalEarnestMoney','Will an additional deposit be due?','yes_no'),visibleWhen:visible('purchase.hasEarnestMoney')},
  money('purchase.additionalEarnestMoneyInCents','Additional deposit',true,visible('conditions.additionalEarnestMoney')),
  number('purchase.additionalEarnestMoneyDueDays','Calendar days after acceptance for the additional deposit',1,60,visible('conditions.additionalEarnestMoney')),
  choice('purchase.financingType','Funding method',[{value:'cash',label:'Cash'},{value:'conventional',label:'Conventional loan'},{value:'fha',label:'FHA loan'},{value:'va',label:'VA loan'},{value:'usda',label:'USDA loan'}]),
  {...money('purchase.loanAmountInCents','Proposed loan amount'),visibleWhen:{match:'all',conditions:[{fieldPath:'purchase.financingType',operator:'not_equals',value:'cash'}]}},
  {...number('purchase.loanTermYears','Loan term in years',1,40),visibleWhen:{match:'all',conditions:[{fieldPath:'purchase.financingType',operator:'not_equals',value:'cash'}]}},
  {id:'fha-protection',type:'information',label:'FHA financing includes the HUD amendatory clause in this agreement. A low appraisal does not require forfeiture of the deposit; the buyer may elect to proceed. The lender may require additional signed certifications.',visibleWhen:visible('purchase.financingType','fha')},
  {id:'va-protection',type:'information',label:'VA financing includes the VA escape clause in this agreement. If the price exceeds VA reasonable value, the buyer may decline to proceed without a forfeiture penalty, or elect to proceed.',visibleWhen:visible('purchase.financingType','va')},
  money('purchase.sellerConcessionsInCents','Seller concessions',false),
 ]},
 {id:'conditions',title:'Inspection, appraisal and financing contingencies',questions:[
  {...number('deadlines.inspectionPeriodDays','Inspection contingency review period — calendar days after acceptance',1,60),helpText:'This is a negotiated deadline, not a statutory default. A contingency is removed only by an express written notice signed by the buyer.'},
  q('conditions.appraisal','Is purchase contingent on an appraisal at least equal to the price?','yes_no'),
  number('deadlines.appraisalPeriodDays','Appraisal review period — calendar days after acceptance',1,90,visible('conditions.appraisal')),
  {...q('conditions.financing','Is obtaining the proposed loan a contingency?','yes_no'),visibleWhen:{match:'all',conditions:[{fieldPath:'purchase.financingType',operator:'not_equals',value:'cash'}]}},
  number('purchase.loanApplicationDays','Days after acceptance to apply for financing',1,30,visible('conditions.financing')),
  number('purchase.loanApprovalDays','Loan approval review period — days after acceptance',1,90,visible('conditions.financing')),
  q('conditions.saleOfBuyersProperty','Must the buyer sell another property?','yes_no'),
  {...q('additionalTerms','Other property, sale deadline and cancellation terms','textarea'),visibleWhen:visible('conditions.saleOfBuyersProperty')},
  {id:'written-removal',type:'information',label:'The stated review period does not automatically waive a contingency. Seller may request written removal or cancellation using the notice process in this agreement. Statutory cancellation rights remain separate.'},
 ]},
 {id:'deadlines',title:'Disclosures and close of escrow',questions:[
  {...q('deadlines.sellerDisclosureDate','Agreed deadline for seller documents, if any','date',false),helpText:'Deliver statutory disclosures as soon as practicable. This date does not postpone a statutory duty or eliminate late-delivery cancellation rights.'},
  q('deadlines.settlementDate','Close-of-escrow date','date'),
  {id:'pacific-time',type:'information',label:'Contract calendar deadlines end at 11:59 p.m. Pacific time. Day counts begin the day after acceptance. Offer expiration uses the exact date and time selected later.'},
 ]},
 {id:'settlement',title:'Title, escrow, costs and possession',questions:[
  {...q('settlement.closingAgentName','Escrow or title company, if selected','text',false),helpText:'If blank, buyer and seller will jointly select a qualified independent escrow holder.'},
  choice('settlement.titlePolicyPayer','Who pays the owner’s title policy?',[{value:'seller',label:'Seller'},{value:'buyer',label:'Buyer'}]),
  number('settlement.titleEvidenceDaysBeforeClosing','Days before closing to deliver the preliminary title report',1,45),
  choice('settlement.specialAssessmentPayer','Who pays assessments levied before closing?',allocation),
  {...choice('settlement.hoaTransferFeePayer','Who pays applicable association transfer fees?',allocation),visibleWhen:visible('disclosures.sellerReportsHoa')},
  {id:'possession',type:'information',label:'Vacant possession is due when the deed records. Existing tenants or seller occupancy continuing after closing require separately signed occupancy terms and compliance with tenant law.'},
 ]},
 {id:'disclosures',title:'Seller documents and actual buyer receipt',questions:[
  {...choice('disclosures.propertyConditionStatus','Transfer Disclosure Statement (TDS)',receipt),helpText:'Review the uploaded disclosure before acknowledging receipt. Select pending if the seller has not provided this document yet.'},
  {...q('sellerFacts.transferExemptionBasis','Seller’s stated TDS exemption','textarea',false),readOnly:true,visibleWhen:visible('sellerFacts.transferDisclosure','exempt')},
  choice('disclosures.naturalHazardStatus','Natural Hazard Disclosure statement and applicable report',receipt),
  {...q('sellerFacts.naturalHazardExemptionBasis','Seller’s stated NHD exemption','textarea',false),readOnly:true,visibleWhen:visible('sellerFacts.naturalHazardDisclosure','exempt')},
  choice('disclosures.fireHardeningStatus','Applicable pre-2010 fire-hardening disclosure, including retrofit information',receipt),
  choice('disclosures.defensibleSpaceStatus','Defensible-space compliance document or buyer agreement',[...receipt,{value:'buyer_agreement',label:'Buyer agrees to obtain compliance documentation under Civil Code 1102.19(b)'}]),
  {id:'defensible-instructions',type:'information',label:'If the buyer-agreement option applies, the signed agreement includes the buyer’s obligation to follow the local ordinance or obtain documentation within one year after closing when the statutory inspection process is available. This does not excuse maintenance requirements.'},
  choice('disclosures.renovationStatus','Applicable recent-resale renovation, contractor and permit disclosures',receipt),
  choice('disclosures.waterTankStatus','Applicable assisted domestic water tank disclosure',receipt),
  {...q('disclosures.sellerReportsHoa','Seller reports association membership','yes_no'),readOnly:true},
  choice('disclosures.hoaDocumentsStatus','Applicable HOA or condominium resale documents',receipt),
  choice('disclosures.leadPaintStatus','Federal lead disclosure, available reports and EPA pamphlet',[{value:'pending',label:'Not yet received — required before signing if applicable'},{value:'received',label:'I received and reviewed the uploaded lead packet'},{value:'built_1978_or_later',label:'The listing confirms construction in 1978 or later'},{value:'exempt',label:'A federal exemption applies'}]),
  {...q('disclosures.leadExemptionBasis','Seller’s federal exemption and supporting facts','textarea'),readOnly:true,visibleWhen:visible('disclosures.leadPaintStatus','exempt')},
  {...choice('disclosures.leadInspectionSelection','Buyer’s lead inspection opportunity',[{value:'ten_days',label:'10 days after acceptance'},{value:'waived',label:'Buyer waives the inspection opportunity'},{value:'other_period',label:'Another period agreed in writing'}]),visibleWhen:visible('disclosures.leadPaintStatus','received')},
  number('disclosures.leadInspectionDays','Agreed lead inspection days',1,60,visible('disclosures.leadInspectionSelection','other_period')),
  {...q('disclosures.sellerReportsExistingLeases','Seller reports existing leases','yes_no'),readOnly:true},
  q('disclosures.leaseStatementAcknowledged','I reviewed the seller’s lease statement and understand that continuing occupancy requires written terms.','acknowledgement'),
  {id:'appraisal-notice',type:'information',label:'Appraisal nondiscrimination — Civil Code 1102.6g',description:notices.appraisal},
  {id:'megans-notice',type:'information',label:'Megan’s Law notice — Civil Code 2079.10a',description:notices.megansLaw},
  {id:'supplemental-tax-notice',type:'information',label:'Notice of your supplemental property tax bill',description:notices.supplementalTax},
  {id:'electrical-notice',type:'information',label:'Electrical-system inspection advice — Civil Code 1102.6i',description:notices.electrical},
  q('disclosures.californiaNoticesAcknowledged','I read the California statutory notices and understand the disclosure statuses selected above.','acknowledgement'),
 ]},
 {id:'additional',title:'Additional terms',questions:[
  {...q('additionalTerms','Other agreed terms','textarea',false),visibleWhen:visible('conditions.saleOfBuyersProperty',false)},
  {id:'legal-advice',type:'information',label:'Obtain independent review for special terms, continuing tenancies, tax consequences, brokerage representation and local point-of-sale requirements. NavStreet is an advertising platform and does not act as an agent or escrow holder.'},
 ]},
 {id:'delivery',title:'Expiration, delivery and review',questions:[
  {id:'expiration',type:'date_time',fieldPath:'delivery.expiresAt',label:'Offer expires — Pacific time',timeZone:'America/Los_Angeles',validation:required},
  q('delivery.electronicDeliveryAuthorized','I consent to electronic delivery and signatures for this offer.','acknowledgement'),
 ]},
];
