// Explicit cash-purchase examples for compatibility tests, not recommended contract elections.
const path=require('node:path');
const CODES=['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC'];
function createCompletedContractFixture(project,code,now=new Date()) {
 const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
 const pkg=registry.requireStateContractPackage(code);
 const day=n=>new Date(now.getTime()+n*86400000).toISOString().slice(0,10);
 const party=role=>({partyUid:role,userUid:role,role,capacity:'individual',firstName:'Sample',lastName:role,
  legalName:'Sample '+role,email:role+'@example.com',phone:'9195550100',
  mailingAddress:{addressLine1:'100 Sample Street',city:'Sample City',state:code,zipCode:'27587',country:'US'},
  sequence:1,primaryParty:true,requiredSigner:true,identityVerification:{status:'verified'},
  signature:{status:'not_started'},electronicTransactionsConsentAccepted:true});
 const buyer=party('buyer'),seller=party('seller');
 const property={listingUid:'sample',addressLine1:'100 Sample Street',city:'Sample City',state:code,zipCode:'27587',
  county:'Sample County',legalDescription:'Sample Lot 1, Block A, recorded plat book 1, page 1',
  propertyType:'single_family',yearBuilt:2000,listPriceInCents:35000000};
 const terms=pkg.createInitialOfferTerms({contractType:pkg.contractTypes[0],property,buyer,seller,listingData:{
  sellerStatements:{ownershipStatus:'owned_at_least_one_year',fuelTankPresent:false,leadBasedPaintApplies:false,
   ownersAssociationApplies:false,leasesExist:false,generalLeasesExist:false,residentialLeasesExist:false,
   fixtureLeasesExist:false,naturalResourceLeasesExist:false,utahMethamphetamineContamination:false,
   southCarolina:{beachfrontApplies:false,futureVacationBookingsExist:false}},
  coloradoPropertyFacts:{metroDistrict:'not_applicable',waterSource:'Municipal water'},
 }});
 terms.delivery.expiresAt=new Date(now.getTime()+48*3600000).toISOString();terms.delivery.electronicDeliveryAuthorized=true;
 if(['UT','WI','FL','LA','CA','SC'].includes(code)) {
  Object.assign(terms.purchase,{purchasePriceInCents:35000000,financingType:'cash',loanAmountInCents:0,
   hasEarnestMoney:true,earnestMoneyInCents:100000,earnestMoneyHolder:'Sample Escrow Company',earnestMoneyDueDays:3,
   additionalEarnestMoneyInCents:0,sellerConcessionsInCents:0});
  Object.assign(terms.conditions,{dueDiligence:true,appraisal:false,financing:false,saleOfBuyersProperty:false,additionalEarnestMoney:false});
  Object.assign(terms.deadlines,{sellerDisclosureDate:day(5),settlementDate:day(30),dueDiligenceDate:day(14)});
  Object.assign(terms.settlement||{}, {possession:'at_recording',specialAssessmentPayer:'seller',hoaTransferFeePayer:'seller',
   titlePolicyPayer:'seller',closingAgentName:'Sample Closing Company',titleEvidenceDaysBeforeClosing:5});
  Object.assign(terms.disclosures,{leadPaintStatus:'built_1978_or_later',hoaDocumentsStatus:'not_applicable',
   sellerReportsExistingLeases:false,leaseStatementAcknowledged:true});
  if(terms.propertyItems && 'fixturesIncluded' in terms.propertyItems)terms.propertyItems.fixturesIncluded=true;
 }
 if(code==='NC') {
  terms.purchase.financingType='cash';Object.assign(terms.deposits,{depositInCents:100000,escrowAgentName:'Sample Escrow Company',
   dueDiligenceDeadlineType:'specific_date',dueDiligenceEndDate:day(14)});
  terms.settlement.settlementDate=day(30);
  for(const receipt of Object.values(terms.buyerDisclosures))Object.assign(receipt,{status:'received',acknowledged:true});
 }
 if(code==='TX') {
  Object.assign(terms.salesPrice,{cashPortionInCents:35000000,financingInCents:0});
  terms.propertyTerms.mineralWaterTimberReservationApplies=false;
  Object.assign(terms.earnestMoneyAndOption,{escrowAgentName:'Sample Escrow Company',escrowAgentAddress:'100 Sample Street',earnestMoneyInCents:100000});
  Object.assign(terms.titlePolicy,{titleCompanyName:'Sample Title Company',titlePolicyExpensePayer:'seller',boundaryExceptionTreatment:'not_amended_or_deleted'});
  Object.assign(terms.survey,{selection:'buyer_new_survey',deliveryDays:10,titleObjectionDays:5});
  terms.disclosures.propertyCondition.status='received';terms.disclosures.waterRights.status='received';
  terms.propertyCondition.acceptance='as_is';Object.assign(terms.closingAndPossession,{closingDate:day(30),possession:'upon_closing_and_funding'});
  terms.expenses.sellerContributionToBuyerExpensesType='none';terms.expenses.sellerContributionToBuyerBroker.contributionType='none';
  terms.expenses.buyerContributionToSellerBroker.contributionType='none';
 }
 if(code==='OK') {
  Object.assign(terms.purchase,{earnestMoneyInCents:100000,trustAccountHolder:'Sample Escrow Company'});
  Object.assign(terms.closing,{closingDate:day(30),possessionTerms:'Upon closing'});
  Object.assign(terms.disclosures,{propertyConditionStatus:'received',leadBasedPaintStatus:'not_applicable',costEstimateReceived:true,contractGuideAvailable:true});
  Object.assign(terms.title,{evidenceSelection:'title_insurance_commitment',surveySelection:'none_unless_required'});
  terms.serviceAgreement.selection='none';terms.buyerAffidavitComplianceConfirmed=true;
 }
 if(code==='UT') {terms.propertyItems.waterRightsIncluded=false;Object.assign(terms.disclosures,{propertyConditionStatus:'received',
  sellerReportsCurrentMethContamination:false,methamphetamineContaminationAcknowledged:true});}
 if(code==='WI') {terms.disclosures.propertyConditionStatus='received';}
 if(code==='FL') Object.assign(terms.disclosures,{propertyConditionStatus:'received',floodStatus:'received',sellerReportsHoa:false,
  taxNoticeAcknowledged:true,radonNoticeAcknowledged:true});
 if(code==='LA') {
  Object.assign(terms.purchase,{depositMethod:'electronic_transfer',cashProofDays:5});
  Object.assign(terms.propertyItems,{mineralRightsReserved:false});
  Object.assign(terms.conditions,{privateWaterSystems:0,privateSepticSystems:0,warranty:'as_is',homeServiceWarranty:'will_not'});
  terms.deadlines.titleCureDays=30;terms.disclosures.propertyDisclosureStatus='received';
 }
 if(code==='CA') Object.assign(terms.disclosures,{propertyConditionStatus:'received',naturalHazardStatus:'received',
  fireHardeningStatus:'not_applicable',defensibleSpaceStatus:'not_applicable',renovationStatus:'not_applicable',
  waterTankStatus:'not_applicable',californiaNoticesAcknowledged:true});
 if(code==='SC') Object.assign(terms.disclosures,{propertyConditionStatus:'received',coastalApplies:false,vacationRentalsApply:false,
  southCarolinaNoticesAcknowledged:true});
 if(code==='CO') {
  Object.assign(terms.purchase,{financingType:'cash',earnestMoneyInCents:100000,earnestMoneyHolder:'Sample Escrow Company',
   earnestMoneyForm:'Electronic transfer',cashAtClosingInCents:34900000,availableCashConfirmed:true});
  Object.assign(terms.conditions,{saleOfBuyerProperty:false,inspection:true,appraisal:false,ownerTitlePolicyPayer:'seller',newSurvey:'none',
   deedType:'special_warranty',closingFeePayer:'split',specialAssessmentPayer:'seller'});
  Object.assign(terms.elections,{vesting:'tenants_in_common',separatePersonalPropertyAgreement:false,waterRightsExamination:false,
   mineralRightsExamination:false,principalResidence:true,insuranceReview:false,dueDiligenceReview:false,titleEvidence:'commitment',
   extendedCoverage:false,taxCertificatePayer:'seller',closingInstructions:false,taxProration:'previous_year',transferTaxPayer:'split',
   salesUseTaxPayer:'buyer',privateTransferFeePayer:'seller',waterTransferFeePayer:'seller',utilityTransferFeePayer:'buyer',buyerDefaultRemedy:'liquidated_damages'});
  Object.assign(terms.deadlines,{closing:day(30),possession:day(30),recordTitle:day(7),recordTitleObjection:day(10),offRecordTitle:day(7),
   offRecordTitleObjection:day(10),titleResolution:day(12),alternativeEarnestMoney:day(3),inspectionTermination:day(14),
   inspectionObjection:day(12),inspectionResolution:day(14),timeOfDay:'17:00',possessionTime:'17:00',extendHoliday:false});
  Object.assign(terms.disclosures,{sellerPropertyStatus:'received',waterSourceAcknowledged:true,radonBrochureAcknowledged:true,
   radonInformationAcknowledged:true,sellerReportsHoa:false,associationStatus:'not_applicable',leadPaintStatus:'not_applicable'});
 }
 const offer={Uid:'sample',stateCode:code,listingUid:'sample',currentVersionUid:'sample-version',status:'draft',referenceNumber:'SAMPLE-'+code};
 const version={Uid:'sample-version',offerUid:'sample',stateCode:code,versionNumber:1,status:'draft',immutable:false,
  initiatedBy:'buyer',initiatedByUid:'buyer',terms,buyers:[buyer],sellers:[seller],expiresAt:terms.delivery.expiresAt,documents:[]};
 return {offer,version};
}
module.exports={CODES,createCompletedContractFixture};
