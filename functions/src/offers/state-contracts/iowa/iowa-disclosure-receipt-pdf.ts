import PDFDocument from 'pdfkit';
import { IOWA_RADON_SHA256, type IowaLateReceipt } from './iowa-disclosure-policy';
import { NAVSTREET_PDF, drawNavStreetSectionBar, registerNavStreetPdfFonts } from '../navstreet-pdf-layout';
export async function generateIowaDisclosureReceiptPdf(receipt:IowaLateReceipt):Promise<Buffer> {
 const pdf=new PDFDocument({size:'LETTER',margin:NAVSTREET_PDF.margin,info:{Title:'Iowa later disclosure delivery receipt',Author:'NavStreet',CreationDate:new Date(receipt.receivedAtMillis)}});
 registerNavStreetPdfFonts(pdf);
 const chunks:Buffer[]=[];
 const done=new Promise<Buffer>((resolve,reject)=>{pdf.on('data',chunk=>chunks.push(Buffer.from(chunk)));pdf.on('end',()=>resolve(Buffer.concat(chunks)));pdf.on('error',reject);});
 drawNavStreetSectionBar(pdf,'Iowa later disclosure delivery receipt');
 pdf.moveDown().font('NavStreet-Regular').fontSize(10).fillColor(NAVSTREET_PDF.ink);
 const lines=[['Receipt',receipt.receiptUid],['Offer / version',`${receipt.offerUid} / ${receipt.reviewedForVersionUid}`],['Listing',receipt.listingUid],['Buyer electronic signature',receipt.typedName],['Buyer account / party',`${receipt.buyerUid} / ${receipt.partyUid}`],['Actual receipt recorded (UTC)',new Date(receipt.receivedAtMillis).toISOString()],['Seller disclosure / exception immutable version',receipt.documentVersions['iowa-seller-disclosure']],['Supported exception claimed by seller',receipt.disclosureExemptionClaimed?'Yes':'No'],['Official Iowa radon fact sheet version',receipt.radonFactSheetVersion],['Radon PDF SHA-256',IOWA_RADON_SHA256]];
 for(const [label,value] of lines) pdf.text(`${label}: ${value}`).moveDown(.5);
 pdf.moveDown().text(receipt.statement,{lineGap:3});
 pdf.moveDown().text('The original signed offer, its disclosure answers, signatures, template identity and delivery dates have not been changed. Statutory withdrawal, amendment and other nonwaivable rights remain in effect. Keep this separate receipt with the original agreement and identified disclosure documents.',{lineGap:3});
 pdf.end();return done;
}
