export const IOWA_DISCLOSURE_REVISION = '2026-10-22' as const;
export const IOWA_RADON_SHA256 = '853ed0fe04cd3ceeabe35bf74e8a38d9688adb59af5352c389fc844b8206e4d9';
export const IOWA_RADON_VERSION = 'iowa-hhs-7917-2020-02-853ed0fe04cd' as const;
export const IOWA_RADON_ASSET = '/assets/state-contracts/iowa/iowa-radon-853ed0fe04cd.pdf';
export const IOWA_RADON_SOURCE = 'https://hhs.iowa.gov/media/7917/download?inline=';
export interface IowaDisclosureSnapshot {
 readonly disclosurePolicyRevision?: string;
 readonly radonFactSheetVersion?: string;
 readonly documentVersions?: Readonly<Record<string,string>>;
 readonly disclosures: {readonly propertyConditionStatus:string;readonly disclosureExemptionClaimed:boolean;readonly radonNoticeAcknowledged:boolean|null};
}
export interface IowaPreofferReceiptIssue { readonly fieldPath:string; readonly message:string; }
export function iowaPreofferReceiptIssue(terms:IowaDisclosureSnapshot):IowaPreofferReceiptIssue|null {
 if (!terms.disclosurePolicyRevision) return null;
 if (terms.disclosurePolicyRevision !== IOWA_DISCLOSURE_REVISION || terms.radonFactSheetVersion !== IOWA_RADON_VERSION) return {fieldPath:'form',message:'The Iowa disclosure package version is not supported.'};
 if (!['received','exempt'].includes(terms.disclosures.propertyConditionStatus)) return {fieldPath:'disclosures.propertyConditionStatus',message:'Review the uploaded Iowa seller condition disclosure or supported exception before submitting.'};
 if (terms.disclosures.propertyConditionStatus === 'exempt' && !terms.disclosures.disclosureExemptionClaimed) return {fieldPath:'disclosures.propertyConditionStatus',message:'An Iowa exception must match the seller-supported statutory basis.'};
 if (!terms.documentVersions?.['iowa-seller-disclosure']) return {fieldPath:'disclosures.propertyConditionStatus',message:'Record the exact Iowa condition disclosure or exception version reviewed.'};
 if (terms.disclosures.radonNoticeAcknowledged !== true) return {fieldPath:'disclosures.radonNoticeAcknowledged',message:'Read and acknowledge receipt of the supplied Iowa Radon Home-Buyers and Sellers Fact Sheet.'};
 return null;
}
export function iowaPreofferReceiptProblem(terms:IowaDisclosureSnapshot):string|null {
 return iowaPreofferReceiptIssue(terms)?.message ?? null;
}

/** Separate later-delivery evidence; never rewrites the original signed answers. */
export const IOWA_LATE_RECEIPT_STATEMENT = 'I acknowledge actual electronic receipt and review of the identified Iowa seller condition disclosure or supported statutory exception and the official Iowa Radon Home-Buyers and Sellers Fact Sheet. My typed name is my electronic signature on this receipt. This receipt does not accept an offer, approve the property condition, waive statutory rights, or change any signed agreement.';
export interface IowaLateReceipt {
 readonly kind:'iowa-later-delivery-2026-10-22';
 readonly receiptUid:string; readonly offerUid:string; readonly listingUid:string;
 readonly partyUid:string; readonly buyerUid:string; readonly typedName:string;
 readonly receivedAtMillis:number; readonly reviewedForVersionUid:string;
 readonly documentVersions:Readonly<Record<string,string>>;
 readonly radonFactSheetVersion:string; readonly disclosureExemptionClaimed:boolean;
 readonly statement:typeof IOWA_LATE_RECEIPT_STATEMENT;
}
const record = (value:unknown):Record<string,unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
export function iowaLateReceipts(offer:unknown):IowaLateReceipt[] {
 const receipts=record(record(offer)['stateDisclosureReceipts']);
 return Object.values(receipts).filter(value=>record(value)['kind']==='iowa-later-delivery-2026-10-22') as IowaLateReceipt[];
}
export function iowaLateReceiptCoversBuyer(offer:unknown, party:unknown, terms:IowaDisclosureSnapshot):boolean {
 const o=record(offer), p=record(party);
 return iowaLateReceipts(offer).some(receipt=>
  receipt.offerUid===o['Uid'] && receipt.listingUid===o['listingUid'] &&
  typeof p['userUid']==='string' && !!p['userUid'] && receipt.buyerUid===p['userUid'] && receipt.partyUid===p['partyUid'] &&
  typeof receipt.typedName==='string' && receipt.typedName.trim()===String(p['legalName']??'').trim() &&
  receipt.statement===IOWA_LATE_RECEIPT_STATEMENT && receipt.radonFactSheetVersion===IOWA_RADON_VERSION &&
  receipt.disclosureExemptionClaimed===terms.disclosures.disclosureExemptionClaimed &&
  Number.isFinite(receipt.receivedAtMillis) && receipt.receivedAtMillis>0 &&
  typeof receipt.documentVersions?.['iowa-seller-disclosure']==='string' && !!receipt.documentVersions['iowa-seller-disclosure']);
}
export function iowaLateReceiptsCover(offer:unknown,buyers:readonly unknown[],terms:IowaDisclosureSnapshot):boolean {
 if (terms.disclosurePolicyRevision) return false;
 const required=buyers.filter(party=>record(party)['requiredSigner']===true);
 return required.length>0 && required.some(party=>iowaLateReceiptCoversBuyer(offer,party,terms));
}
