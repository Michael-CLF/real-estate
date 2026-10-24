import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {HttpsError} from 'firebase-functions/v2/https';
import {PDFDocument} from 'pdf-lib';
/** Only immutable reviewed bytes are included. Current summaries cannot replace a buyer's reviewed notice. */
export const reviewedNoticeReader={async read(listingUid:string,documentType:string,versionId:string):Promise<Buffer>{
 const snap=await getFirestore().doc(`listings/${listingUid}/disclosures/${documentType}/versions/${versionId}`).get();
 const d=snap.data();
 if(!d||d['listingUid']!==listingUid||d['documentType']!==documentType||d['versionId']!==versionId||d['stateAbbreviation']!=='ND'||typeof d['storagePath']!=='string'||typeof d['sellerUid']!=='string'||d['storagePath']!==`listing-disclosures/${d['sellerUid']}/${listingUid}/${documentType}/${versionId}.pdf`)throw new HttpsError('failed-precondition','The exact reviewed statutory notice PDF is unavailable.');
 const [bytes]=await getStorage().bucket().file(d['storagePath']).download();return bytes;
}};
export async function appendReviewedNoticeCopy(base:Buffer,listingUid:string,versionId:string):Promise<{buffer:Buffer;pageCount:number}>{
 const copy=await reviewedNoticeReader.read(listingUid,'north-dakota-statutory-packet',versionId);
 const target=await PDFDocument.load(base),source=await PDFDocument.load(copy);
 for(const page of await target.copyPages(source,source.getPageIndices()))target.addPage(page);
 return {buffer:Buffer.from(await target.save()),pageCount:target.getPageCount()};
}
