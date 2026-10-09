import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { OfferDocument, OfferVersionDocument } from '../offer-types';
import { wrapContinuationText } from './fixed-form-text-continuation';

type SignatureRecordInput = {
  offer: Pick<OfferDocument, 'referenceNumber'>;
  version: Pick<OfferVersionDocument, 'Uid' | 'versionNumber' | 'buyers' | 'sellers'>;
};

/** Render stored snapshot evidence; never mutate or sign an existing PDF here. */
export async function appendFixedFormSignatureRecord(
  pdf: PDFDocument, input: SignatureRecordInput, stateName: string, timeZone: string
): Promise<void> {
  const parties = [...input.version.buyers, ...input.version.sellers];
  if (!parties.some(party => party.signature.status === 'signed')) return;
  for (const party of parties) {
    if (party.signature.status === 'signed' && !party.signature.signedAt) {
      throw new Error('A signed agreement requires a stored signature timestamp for every signed party.');
    }
  }
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const timestamp = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
  });
  const blocks: string[][] = [[
    'Offer: ' + input.offer.referenceNumber + ' / version ' + input.version.versionNumber,
    'Version identifier: ' + input.version.Uid,
    'Signature record from the stored party snapshots for this agreement version.',
    '',
  ]];
  for (const party of parties) {
    const signed = party.signature.status === 'signed';
    blocks.push([
      (party.role === 'buyer' ? 'Buyer: ' : 'Seller: ') + party.legalName,
      'Capacity: ' + party.capacity + ' / required signer: ' + (party.requiredSigner ? 'Yes' : 'No'),
      'Email: ' + party.email,
      'Electronic consent: ' + (party.electronicTransactionsConsentAccepted ? 'Yes' : 'No'),
      'Electronic signature: ' + (signed ? '/s/ ' + party.legalName : 'Pending'),
      'Signed at (' + timeZone + '): ' + (signed ? timestamp.format(party.signature.signedAt!.toDate()) : 'Pending'),
      ''
    ]);
  }
  const pageLines: string[][] = [[]];
  for (const block of blocks) {
    const lines = block.flatMap(row => wrapContinuationText(row, font, 516, 10));
    let current = pageLines[pageLines.length - 1];
    if (current.length && current.length + lines.length > 43) { current = []; pageLines.push(current); }
    for (const line of lines) {
      if (current.length === 43) { current = []; pageLines.push(current); }
      current.push(line);
    }
  }
  const pages = pageLines.length;
  for (let index = 0; index < pages; index++) {
    const page = pdf.addPage([612, 792]);
    page.drawRectangle({ x: 48, y: 718, width: 516, height: 30, color: rgb(.08, .26, .38) });
    page.drawText(stateName + ' - Electronic Signature Record',
      { x: 58, y: 729, size: 11, font: bold, color: rgb(1, 1, 1) });
    for (const [row, line] of pageLines[index].entries()) {
      if (line) page.drawText(line, { x: 48, y: 690 - row * 14, size: 10, font });
    }
    page.drawText('NavStreet - signature record ' + (index + 1) + ' of ' + pages,
      { x: 48, y: 40, size: 8, font });
  }
}
