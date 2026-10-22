import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminFirestore } from '../../../shared/firebase-admin';
import { callableFunctionOptions } from '../../../shared/function-options';
import type { OfferDocument, OfferVersionDocument } from '../../offer-types';
import type { IowaOfferTermsDocument } from './iowa-offer-terms.document';
import { IOWA_LATE_RECEIPT_STATEMENT, IOWA_RADON_VERSION, iowaLateReceipts, type IowaLateReceipt } from './iowa-disclosure-policy';

interface ReceiptRequest {offerUid:string;offerVersionUid:string;partyUid:string;conditionVersionId:string;radonFactSheetVersion:string;typedName:string;acknowledged:boolean;}
function identifier(value:unknown):string {
 if (typeof value!=='string' || !/^[A-Za-z0-9_-]{1,200}$/.test(value)) throw new HttpsError('invalid-argument','A valid document identifier is required.');
 return value;
}
/** Later delivery is a separate signed receipt. No version, terms or signature is edited. */
export const recordIowaDisclosureReceipt = onCall<ReceiptRequest>(callableFunctionOptions,async request=>{
 const uid=request.auth?.uid;
 if (!uid) throw new HttpsError('unauthenticated','Sign in as the buyer to acknowledge delivery.');
 const data=request.data, offerUid=identifier(data?.offerUid), versionUid=identifier(data?.offerVersionUid), partyUid=identifier(data?.partyUid), conditionVersion=identifier(data?.conditionVersionId);
 const typedName=typeof data?.typedName==='string'?data.typedName.trim():'';
 if (data?.acknowledged!==true || data?.radonFactSheetVersion!==IOWA_RADON_VERSION || !typedName || typedName.length>200) throw new HttpsError('invalid-argument','Review the documents, acknowledge actual receipt and type your legal name.');
 const reference=adminFirestore.collection('offers').doc(offerUid);
 const receiptReference=reference.collection('iowaDisclosureReceipts').doc();
 return adminFirestore.runTransaction(async transaction=>{
  const snapshot=await transaction.get(reference);
  if (!snapshot.exists) throw new HttpsError('not-found','The offer could not be found.');
  const offer=snapshot.data() as OfferDocument;
  if (!offer.buyerUids?.includes(uid) || offer.sellerUids?.includes(uid)) throw new HttpsError('permission-denied','Only the receiving buyer can record this receipt.');
  if (offer.stateCode!=='IA' || (offer.currentVersionUid!==versionUid && offer.lastDeliveredVersionUid!==versionUid) || offer.contract?.contractUid || offer.closedReason || !['submitted','viewed','countered','draft'].includes(offer.status)) throw new HttpsError('failed-precondition','This offer is no longer eligible for a later disclosure receipt.');
  const versionSnapshot=await transaction.get(reference.collection('versions').doc(versionUid));
  const version=versionSnapshot.data() as (Omit<OfferVersionDocument,'terms'> & {terms:IowaOfferTermsDocument})|undefined;
  if (!version || version.offerUid!==offerUid || version.stateCode!=='IA' || !version.immutable || !['delivered','signed'].includes(version.status) || version.terms.disclosurePolicyRevision || !Number.isFinite(Date.parse(version.expiresAt)) || Date.parse(version.expiresAt)<=Date.now()) throw new HttpsError('failed-precondition','Use the current unexpired delivered Iowa offer. New offers record receipt before submission.');
  const party=version.buyers.find(value=>value.partyUid===partyUid && value.userUid===uid && value.requiredSigner===true);
  if (!party || party.signature.status!=='signed' || !party.electronicTransactionsConsentAccepted || party.legalName.trim()!==typedName) throw new HttpsError('permission-denied','The receipt must be signed by the required buyer using the legal name on this offer.');
  const listingReference=adminFirestore.collection('listings').doc(offer.listingUid);
  const listingSnapshot=await transaction.get(listingReference);
  const listing=listingSnapshot.data();
  if (!listing || listing['status']!=='active' || listing['activeContractUid']) throw new HttpsError('failed-precondition','The listing is no longer open for offers.');
  const summaryReference=listingReference.collection('disclosures').doc('iowa-seller-disclosure');
  const summary=await transaction.get(summaryReference);
  const current=summary.data()?.['currentDocument'];
  if (current?.versionId!==conditionVersion) throw new HttpsError('failed-precondition','The seller disclosure changed. Refresh and review the current version before acknowledging it.');
  const immutable=await transaction.get(summaryReference.collection('versions').doc(conditionVersion));
  const document=immutable.data();
  if (!document || document['versionId']!==conditionVersion || document['listingUid']!==offer.listingUid || document['stateAbbreviation']!=='IA' || document['documentType']!=='iowa-seller-disclosure' || typeof document['storagePath']!=='string' || !document['storagePath'] || current.storagePath!==document['storagePath']) throw new HttpsError('failed-precondition','A valid immutable Iowa disclosure or supported exception must be uploaded first.');
  const known=iowaLateReceipts(offer).find(receipt=>receipt.partyUid===partyUid && receipt.buyerUid===uid && receipt.typedName===typedName && receipt.documentVersions['iowa-seller-disclosure']===conditionVersion && receipt.statement===IOWA_LATE_RECEIPT_STATEMENT && receipt.radonFactSheetVersion===IOWA_RADON_VERSION && receipt.disclosureExemptionClaimed===version.terms.disclosures.disclosureExemptionClaimed);
  if (known) return {receiptUid:known.receiptUid,alreadyRecorded:true};
  const now=Timestamp.now();
  const receipt:IowaLateReceipt={kind:'iowa-later-delivery-2026-10-22',receiptUid:receiptReference.id,offerUid,listingUid:offer.listingUid,partyUid,buyerUid:uid,typedName,receivedAtMillis:now.toMillis(),reviewedForVersionUid:versionUid,documentVersions:{'iowa-seller-disclosure':conditionVersion},radonFactSheetVersion:IOWA_RADON_VERSION,disclosureExemptionClaimed:version.terms.disclosures.disclosureExemptionClaimed,statement:IOWA_LATE_RECEIPT_STATEMENT};
  const previous=(offer as unknown as {stateDisclosureReceipts?:Record<string,unknown>}).stateDisclosureReceipts??{};
  transaction.create(receiptReference,{...receipt,receivedAt:now});
  transaction.update(reference,{stateDisclosureReceipts:{...previous,[partyUid]:receipt},updatedAt:now});
  return {receiptUid:receipt.receiptUid,alreadyRecorded:false};
 });
});

/** A copy of immutable receipt evidence, separate from the original agreement PDF. */
export const getIowaDisclosureReceiptPdf=onCall<{offerUid:string;receiptUid:string}>(callableFunctionOptions,async request=>{
 const uid=request.auth?.uid;
 if (!uid) throw new HttpsError('unauthenticated','Sign in to download the receipt.');
 const offerUid=identifier(request.data?.offerUid), receiptUid=identifier(request.data?.receiptUid);
 const reference=adminFirestore.collection('offers').doc(offerUid);
 const snapshot=await reference.get(), offer=snapshot.data() as OfferDocument|undefined;
 if (!offer || (!offer.buyerUids?.includes(uid) && !offer.sellerUids?.includes(uid))) throw new HttpsError('permission-denied','Only an offer participant can download this receipt.');
 const receiptSnapshot=await reference.collection('iowaDisclosureReceipts').doc(receiptUid).get();
 const receipt=receiptSnapshot.data() as IowaLateReceipt|undefined;
 if (!receipt || receipt.offerUid!==offerUid || receipt.kind!=='iowa-later-delivery-2026-10-22') throw new HttpsError('not-found','The written receipt could not be found.');
 const {generateIowaDisclosureReceiptPdf}=require('./iowa-disclosure-receipt-pdf') as typeof import('./iowa-disclosure-receipt-pdf');
 const buffer=await generateIowaDisclosureReceiptPdf(receipt);
 return {base64:buffer.toString('base64'),fileName:`NavStreet-Iowa-disclosure-receipt-${receiptUid}.pdf`};
});
