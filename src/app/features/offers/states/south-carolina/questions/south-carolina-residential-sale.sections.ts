import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';
import type { OfferQuestionDefinition, OfferQuestionVisibilityRule } from '../../../engine/models/offer-question-definition';
import { SOUTH_CAROLINA_STATUTORY_NOTICES as notices } from './south-carolina-statutory-notices';
const required = {required:true,message:'Complete this answer before continuing.'};
const visible = (fieldPath:string,value:unknown=true):OfferQuestionVisibilityRule => ({match:'all',conditions:[{fieldPath,operator:'equals',value}]});
const q = (fieldPath:string,label:string,type:'text'|'textarea'|'currency'|'number'|'date'|'yes_no'|'acknowledgement',needed=true):OfferQuestionDefinition => ({id:fieldPath,type,fieldPath,label,...(needed?{validation:required}:{})});
const choice = (fieldPath:string,label:string,options:readonly {value:string;label:string}[]):OfferQuestionDefinition => ({id:fieldPath,type:'single_choice',fieldPath,label,options,validation:required});
const number = (path:string,label:string,min:number,max:number,when?:OfferQuestionVisibilityRule):OfferQuestionDefinition => ({...q(path,label,'number'),validation:{...required,minimum:min,maximum:max},...(when?{visibleWhen:when}:{})});
const money = (path:string,label:string,positive=true,when?:OfferQuestionVisibilityRule):OfferQuestionDefinition => ({...q(path,label,'currency',positive),validation:{...required,required:positive,minimum:positive?1:0},...(when?{visibleWhen:when}:{})});
const receipt = [{value:'pending',label:'Not yet received — seller will provide the applicable documents'},{value:'received',label:'I received and reviewed the uploaded document'},{value:'not_applicable',label:'Not applicable based on the seller’s property facts'},{value:'exempt',label:'Seller reports a statutory exemption — review the stated basis'}];
const allocation=[{value:'seller',label:'Seller'},{value:'buyer',label:'Buyer'},{value:'split',label:'Split equally'}];
export const SOUTH_CAROLINA_RESIDENTIAL_SALE_SECTIONS:readonly OfferSectionDefinition[]=[
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
  {...number('deadlines.inspectionPeriodDays','Inspection contingency review period — calendar days after acceptance',1,60),helpText:'This is a negotiated deadline, not a statutory default. The signed agreement states the cancellation deadline and written-notice requirements.'},
  q('conditions.appraisal','Is purchase contingent on an appraisal at least equal to the price?','yes_no'),
  number('deadlines.appraisalPeriodDays','Appraisal review period — calendar days after acceptance',1,90,visible('conditions.appraisal')),
  {...q('conditions.financing','Is obtaining the proposed loan a contingency?','yes_no'),visibleWhen:{match:'all',conditions:[{fieldPath:'purchase.financingType',operator:'not_equals',value:'cash'}]}},
  number('purchase.loanApplicationDays','Days after acceptance to apply for financing',1,30,visible('conditions.financing')),
  number('purchase.loanApprovalDays','Loan approval review period — days after acceptance',1,90,visible('conditions.financing')),
  q('conditions.saleOfBuyersProperty','Must the buyer sell another property?','yes_no'),
  {...q('additionalTerms','Other property, sale deadline and cancellation terms','textarea'),visibleWhen:visible('conditions.saleOfBuyersProperty')},
  {id:'contingency-deadlines',type:'information',label:'Exercise a contractual cancellation right by written notice before its agreed deadline. Additional repairs, credits or extensions require mutual written agreement. Nonwaivable statutory rights remain separate.'},
 ]},
 {id:'deadlines',title:'Disclosures and closing',questions:[
  {...q('deadlines.sellerDisclosureDate','Agreed delivery date when the condition statement is pending','date',false),helpText:'If the condition statement is pending, this date becomes the contractually agreed delivery deadline under S.C. Code 27-50-50(A). It does not postpone applicable federal lead or beachfront requirements.'},
  q('deadlines.settlementDate','Closing date','date'),
  {id:'pacific-time',type:'information',label:'Contract calendar deadlines end at 11:59 p.m. Eastern time. Day counts begin the day after acceptance. Offer expiration uses the exact date and time selected later.'},
 ]},
 {id:'settlement',title:'Title, closing, costs and possession',questions:[
  {...q('settlement.closingAgentName','South Carolina closing attorney, if selected','text',false),helpText:'If blank, the parties will select a licensed South Carolina closing attorney before closing. NavStreet does not conduct closings.'},
  choice('settlement.titlePolicyPayer','Who pays the owner’s title policy?',[{value:'seller',label:'Seller'},{value:'buyer',label:'Buyer'}]),
  number('settlement.titleEvidenceDaysBeforeClosing','Days before closing to deliver the preliminary title report',1,45),
  choice('settlement.specialAssessmentPayer','Who pays assessments levied before closing?',allocation),
  {...choice('settlement.hoaTransferFeePayer','Who pays applicable association transfer fees?',allocation),visibleWhen:visible('disclosures.sellerReportsHoa')},
  {id:'possession',type:'information',label:'Possession is due at completed closing and recording, subject to disclosed vacation rentals and expressly agreed lawful continuing occupancy. Seller occupancy after closing requires separately signed terms.'},
 ]},
 {id:'disclosures',title:'Disclosures and property-specific terms',questions:[
  {...choice('disclosures.propertyConditionStatus','Residential Property Condition Disclosure Statement',[
    {value:'received',label:'I received and reviewed the uploaded statement'},
    {value:'pending',label:'Deliver by the agreed date in this contract'},
    {value:'exempt',label:'A statutory transfer exemption applies'},
    {value:'waived',label:'Propose that both parties agree in writing not to complete this statement'},
  ]),helpText:notices.condition},
  {...q('disclosures.propertyExemptionBasis','Statutory exemption and supporting facts','textarea'),visibleWhen:visible('disclosures.propertyConditionStatus','exempt')},
  {...q('disclosures.sellerReportsHoa','Seller reports association membership','yes_no'),readOnly:true},
  choice('disclosures.hoaDocumentsStatus','Association documents',[{value:'received',label:'I received and reviewed the uploaded documents'},{value:'pending',label:'Documents will be provided by the agreed deadline'},{value:'not_applicable',label:'No association documents apply'}]),
  choice('disclosures.leadPaintStatus','Federal lead disclosure, available reports and EPA pamphlet',[{value:'pending',label:'Not yet received — required before signing if applicable'},{value:'received',label:'I received and reviewed the uploaded lead packet'},{value:'built_1978_or_later',label:'The listing confirms construction in 1978 or later'},{value:'exempt',label:'A federal exemption applies'}]),
  {...q('disclosures.leadExemptionBasis','Federal exemption and supporting facts','textarea'),visibleWhen:visible('disclosures.leadPaintStatus','exempt')},
  {...choice('disclosures.leadInspectionSelection','Buyer’s lead inspection opportunity',[{value:'ten_days',label:'10 days after acceptance'},{value:'waived',label:'Buyer waives the inspection opportunity'},{value:'other_period',label:'Another period agreed in writing'}]),visibleWhen:visible('disclosures.leadPaintStatus','received')},
  number('disclosures.leadInspectionDays','Agreed lead inspection days',1,60,visible('disclosures.leadInspectionSelection','other_period')),
  {...q('disclosures.sellerReportsExistingLeases','Seller reports existing leases','yes_no'),readOnly:true},
  q('disclosures.leaseStatementAcknowledged','I reviewed the seller’s lease statement and any proposed continuing occupancy.','acknowledgement'),
  {...q('disclosures.coastalApplies','Does seller’s information identify property seaward of a beachfront setback or jurisdictional line?','yes_no'),helpText:notices.coastal},
  {...q('disclosures.coastalBaselineDescription','Seller-provided baseline location and source','textarea'),visibleWhen:visible('disclosures.coastalApplies')},
  {...q('disclosures.coastalSetbackDescription','Seller-provided setback / jurisdictional line location','textarea'),visibleWhen:visible('disclosures.coastalApplies')},
  {...q('disclosures.coastalStructureCoordinates','Seaward corners of all habitable structures — SC State Plane NAD-1983 coordinates','textarea'),visibleWhen:visible('disclosures.coastalApplies')},
  {...q('disclosures.coastalErosionRate','Latest departmental local erosion rate, zone and source date','textarea'),visibleWhen:visible('disclosures.coastalApplies')},
  {...q('disclosures.vacationRentalsApply','Has seller disclosed existing future vacation rental bookings?','yes_no'),helpText:notices.rentals},
  {...q('disclosures.vacationRentalPeriods','All future rental periods disclosed by seller, with management and occupancy arrangements','textarea'),visibleWhen:visible('disclosures.vacationRentalsApply')},
  {id:'closing-information',type:'information',label:'South Carolina closing attorney',description:notices.closing},
  q('disclosures.southCarolinaNoticesAcknowledged','I reviewed the South Carolina disclosure, rental and closing information.','acknowledgement'),
 ]},
 {id:'additional',title:'Additional terms',questions:[
  {...q('additionalTerms','Other agreed terms','textarea',false),visibleWhen:visible('conditions.saleOfBuyersProperty',false)},
  {id:'legal-advice',type:'information',label:'Obtain independent review for special terms, continuing tenancies, tax consequences, brokerage representation and local point-of-sale requirements. NavStreet is an advertising platform and does not act as an agent or escrow holder.'},
 ]},
 {id:'delivery',title:'Expiration, delivery and review',questions:[
  {id:'expiration',type:'date_time',fieldPath:'delivery.expiresAt',label:'Offer expires — Eastern time',timeZone:'America/New_York',validation:required},
  q('delivery.electronicDeliveryAuthorized','I consent to electronic delivery and signatures for this offer.','acknowledgement'),
 ]},
];
