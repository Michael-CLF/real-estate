import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
import { HttpsError } from 'firebase-functions/v2/https';
import type { StateContractPackage } from '../state-contract-package';
import type { SouthCarolinaOfferTermsDocument } from './south-carolina-offer-terms.document';
import { createSouthCarolinaInitialOfferTerms } from './south-carolina-initial-terms';
import { sanitizeSouthCarolinaDraftTerms } from './south-carolina-draft-terms-sanitizer';
import { validateSouthCarolinaSubmission } from './south-carolina-submission-validator';
import { createSouthCarolinaContractMilestones } from './south-carolina-contract-milestones';
import { generateSouthCarolinaOfferPdf } from './south-carolina-offer-pdf.service';
import { SOUTH_CAROLINA_DOCUMENT_RULES } from './south-carolina-document-rules';
export const southCarolinaStateContractPackage: StateContractPackage<SouthCarolinaOfferTermsDocument> = {
  stateCode:'SC', offerCreationEnabled:true, contractTypes:['navstreet_south_carolina_residential_sale_2026'],contractTypeRequired:true,
  defaultTimeZone:'America/New_York', agreementTemplate:{stateCode:'SC',templateUid:SOUTH_CAROLINA_DOCUMENT_RULES.templateUid,templateName:'NavStreet South Carolina Residential Purchase and Sale Agreement',templateVersion:SOUTH_CAROLINA_DOCUMENT_RULES.version},
  createInitialOfferTerms:createSouthCarolinaInitialOfferTerms,sanitizeDraftTerms:sanitizeSouthCarolinaDraftTerms,validateSubmission:validateSouthCarolinaSubmission,
  validateBeforeSigning:({version})=> {if(version.terms.disclosures.leadPaintStatus==='pending' && (version.terms.property.yearBuilt == null || version.terms.property.yearBuilt < 1978)) throw new HttpsError('failed-precondition','Applicable federal lead disclosures must be received before signing.');},
  requiredListingDisclosures:({version})=> ([
    ['propertyConditionStatus','south-carolina-property-condition'],
    ['hoaDocumentsStatus','south-carolina-association-documents'],
    ['leadPaintStatus','lead-based-paint'],
  ] as const).filter(([field])=>version.terms.disclosures[field]==='received').map(([,type])=>type),
  createContractMilestones:createSouthCarolinaContractMilestones,  getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, t.purchase.loanAmountInCents, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.purchase.hasEarnestMoney === false ? 0 : t.purchase.earnestMoneyInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.deadlines.settlementDate) },
    { label: 'Inspection / due diligence', value: `${t.deadlines.inspectionPeriodDays} calendar days after acceptance; see agreement counting rules` },
  ],
  generateAgreement:generateSouthCarolinaOfferPdf,
};
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
export async function readSouthCarolinaListingDisclosures(transaction: Transaction, listingReference: DocumentReference, listing: Record<string,unknown>): Promise<{documentVersions: Record<string,string>}> {
  const types=['south-carolina-property-condition','south-carolina-association-documents','south-carolina-coastal-disclosure','south-carolina-vacation-rentals','lead-based-paint'];
  const snapshots=await Promise.all(types.map(type=>transaction.get(listingReference.collection('disclosures').doc(type))));
  const documentVersions: Record<string,string>={};
  for(const [index,type] of types.entries()) {
    const file=snapshots[index].data()?.['currentDocument'] as Record<string,unknown>|undefined;
    if(file && file['listingUid']===listingReference.id && file['sellerUid']===listing['sellerUid'] && file['stateAbbreviation']==='SC' && file['documentType']===type && typeof file['versionId']==='string' && /^[A-Za-z0-9_-]{1,180}$/.test(file['versionId']) && file['storagePath']===`listing-disclosures/${listing['sellerUid']}/${listingReference.id}/${type}/${file['versionId']}.pdf`) documentVersions[type]=file['versionId'];
  }
  return {documentVersions};
}
