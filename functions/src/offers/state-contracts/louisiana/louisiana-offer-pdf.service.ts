import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { LouisianaOfferTermsDocument } from './louisiana-offer-terms.document';

type PdfInput = GenerateStateAgreementInput<LouisianaOfferTermsDocument>;
const BLUE = rgb(21 / 255, 67 / 255, 96 / 255);
const TEAL = rgb(20 / 255, 151 / 255, 156 / 255);
const INK = rgb(30 / 255, 48 / 255, 62 / 255);
const MUTED = rgb(92 / 255, 109 / 255, 122 / 255);
const PALE = rgb(240 / 255, 247 / 255, 249 / 255);
const PAGE_W = 612;
const PAGE_H = 792;
const LEFT = 48;
const WIDTH = PAGE_W - LEFT * 2;

const dollars = (cents: number): string =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const readableDate = (value: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(`${value}T12:00:00Z`));
};

/**
 * A NavStreet direct-party agreement. It does not reproduce the LREC PDF or
 * imply that either party is represented by a broker. The seller's statutory
 * property disclosure and any applicable lead packet remain separate records.
 */
export async function generateLouisianaOfferPdf(input: PdfInput): Promise<GeneratedStateAgreement> {
  const { offer, version } = input;
  const t = version.terms;
  const p = t.purchase;
  const c = t.conditions;
  const d = t.deadlines;
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoPath = path.resolve(__dirname, '../../../../assets/navstreet-logo.png');
  const logo = await pdf.embedPng(await readFile(logoPath));
  const address = [t.property.addressLine1, t.property.addressLine2].filter(Boolean).join(' ');
  const fullAddress = `${address}, ${t.property.city}, LA ${t.property.zipCode}`;
  const offeredBy = version.initiatedBy === 'buyer' ? version.buyers : version.sellers;
  const recipient = version.initiatedBy === 'buyer' ? version.sellers : version.buyers;
  const parties = [
    ...version.buyers.map(person => ({ side: 'Buyer', person })),
    ...version.sellers.map(person => ({ side: 'Seller', person })),
  ];

  let page!: PDFPage;
  let y = 0;

  function nextPage(): void {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 715, width: PAGE_W, height: 77, color: BLUE });
    page.drawImage(logo, { x: LEFT, y: 723, width: 155, height: 62 });
    page.drawText('LOUISIANA | RESIDENTIAL', { x: 234, y: 747, font: bold, size: 13, color: rgb(1, 1, 1) });
    page.drawRectangle({ x: LEFT, y: 708, width: WIDTH, height: 3, color: TEAL });
    y = 682;
  }

  function need(height: number): void {
    if (y - height < 62) nextPage();
  }

  function lines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const result: string[] = [];
    for (const raw of text.replace(/\r/g, '').split('\n')) {
      if (!raw.trim()) {
        result.push('');
        continue;
      }
      let current = '';
      for (const word of raw.trim().split(/\s+/)) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          current = candidate;
          continue;
        }
        if (current) result.push(current);
        current = '';
        for (const character of word) {
          if (current && font.widthOfTextAtSize(current + character, size) > maxWidth) {
            result.push(current);
            current = '';
          }
          current += character;
        }
      }
      if (current) result.push(current);
    }
    return result;
  }

  function paragraph(value: string, size = 9.5, color = INK): void {
    const wrapped = lines(value, regular, size, WIDTH);
    for (const line of wrapped) {
      need(13);
      if (line) page.drawText(line, { x: LEFT, y, font: regular, size, color });
      y -= 13;
    }
    y -= 8;
  }

  function section(title: string): void {
    need(48);
    y -= 8;
    page.drawRectangle({ x: LEFT, y: y - 5, width: 4, height: 21, color: TEAL });
    page.drawText(title, { x: LEFT + 13, y, font: bold, size: 13, color: BLUE });
    y -= 28;
  }

  function detail(label: string, value: string): void {
    const wrapped = lines(value || 'None stated', regular, 9.2, WIDTH - 24);
    const height = 20 + wrapped.length * 13;
    need(height + 8);
    page.drawRectangle({ x: LEFT, y: y - height, width: WIDTH, height, color: PALE });
    page.drawText(label.toUpperCase(), { x: LEFT + 12, y: y - 14, font: bold, size: 7.8, color: BLUE });
    let lineY = y - 29;
    for (const line of wrapped) {
      if (line) page.drawText(line, { x: LEFT + 12, y: lineY, font: regular, size: 9.2, color: INK });
      lineY -= 13;
    }
    y -= height + 9;
  }

  function signedAt(person: (typeof version.buyers)[number]): string {
    const timestamp = person.signature.signedAt;
    if (person.signature.status !== 'signed' || !timestamp) return 'Awaiting signature';
    const instant = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp as unknown as string);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago',
    }).format(instant) + ' (Louisiana local time)';
  }

  nextPage();
  page.drawText('LOUISIANA RESIDENTIAL PURCHASE AND SALE AGREEMENT', {
    x: LEFT, y, font: bold, size: 15, color: BLUE,
  });
  y -= 30;
  paragraph('Direct agreement between the buyers and sellers identified below. Each counteroffer is a separate version; this document records the terms of the version shown here.', 9, MUTED);
  detail('Offer reference', `${offer.referenceNumber} / version ${version.versionNumber}`);
  detail('Property', fullAddress);
  detail('Buyers', version.buyers.map(person => person.legalName).join('; '));
  detail('Sellers', version.sellers.map(person => person.legalName).join('; '));

  section('1 | Property and items conveyed');
  paragraph('The seller offers to sell, and the buyer offers to purchase, the Louisiana immovable property described below, together with its buildings, structures, installed equipment and permanently attached improvements, subject to applicable title and zoning restrictions, servitudes of record, and law or ordinances affecting the property.');
  detail('Parish', t.property.county);
  detail('Seller-provided legal description', t.legalDescription);
  detail(
    'Land and grounds',
    t.propertyItems.groundsDescription || 'As per record title',
  );
  paragraph('Existing attached and installed items, landscaping, fences, fixtures, window coverings and their hardware, built-in appliances, heating and cooling equipment, lighting and installed systems convey if in place when this agreement is signed, except as expressly excluded below. Seller-owned standing timber, unharvested crops and ungathered fruits also convey. Movable items listed below transfer without warranty, have no assigned value and do not form part of the sale price.');
  detail('Additional movable items included', t.propertyItems.included || 'None');
  detail('Items excluded', t.propertyItems.excluded || 'None');
  detail('Mineral rights', t.propertyItems.mineralRightsReserved
    ? `Seller reserves ${t.propertyItems.mineralRightsPercent}% of the mineral rights seller owns, waiving surface-use rights for reserved minerals.`
    : 'All mineral rights held by seller, if any, transfer to buyer without warranty.');

  section('2 | Price, deposit and financing');
  detail('Purchase price', dollars(p.purchasePriceInCents));
  if (p.hasEarnestMoney) {
    detail('Buyer deposit', `${dollars(p.earnestMoneyInCents)} by ${p.depositMethod.replace(/_/g, ' ')}; delivered within 72 hours after notice of acceptance to ${p.earnestMoneyHolder}.`);
    paragraph('The named deposit holder will hold the deposit for the transaction. Failure to timely deliver the promised deposit constitutes default. If the parties dispute entitlement to the deposit, they may seek a written mutual direction or determination under applicable law.');
  } else {
    detail('Buyer deposit', 'No deposit');
  }
  if (p.financingType === 'cash') {
    detail('Payment method', 'All cash');
    paragraph(`Buyer warrants that cash is readily available and will provide proof of funds acceptable to seller within ${p.cashProofDays} calendar days after the agreement becomes effective. Seller may terminate by written notice if buyer does not timely provide the required proof.`);
  } else {
    detail('Payment method', `${p.financingSource.replace(/_/g, ' ')} financing; proposed loan ${dollars(p.loanAmountInCents)}; maximum initial interest rate ${p.maxInterestRatePercent}% per year; loan amortization not less than ${p.loanTermYears} years.`);
    if (p.otherFinancingConditions.trim()) detail('Other financing terms', p.otherFinancingConditions);
    paragraph(`This sale is conditioned on buyer obtaining the stated loan. Within ${p.loanApplicationDays} calendar days after acceptance, buyer must apply, authorize the lender to proceed and provide seller written documentation of those actions. If buyer fails to do so, seller may terminate by written notice. Buyer must make good faith efforts to obtain financing and have funds available for the down payment, closing costs and prepaid items. Lender requirements do not extend the Act of Sale date unless both parties agree in writing.`);
  }
  detail('Seller contribution toward buyer closing costs', dollars(p.sellerConcessionsInCents));

  section('3 | Other-property condition and leases');
  detail('Buyer sale contingency', c.saleOfBuyersProperty ? c.saleOfBuyersPropertyTerms : 'Not contingent on the sale of another property.');
  paragraph('Seller shall provide buyer copies of existing written leases, excluding mineral leases, within five calendar days after acceptance. Buyer has five calendar days after receiving them to state in writing whether they are acceptable. Seller transfers applicable leases, security deposits and access at or before the Act of Sale.');

  section('4 | Condition, inspection and remedies');
  paragraph('The agreed price reflects the property\'s apparent current condition. Unless expressly agreed in writing, seller is not obligated to make repairs, including lender-required repairs, but shall maintain the property in substantially the same or better condition from execution through the Act of Sale.');
  paragraph(`The buyer\'s due diligence and inspection period begins on the first day after acceptance and expires ${d.inspectionPeriodDays} calendar days after it begins, or upon seller's receipt of the buyer's signed written request for remedies, whichever occurs first. Seller shall provide utilities and immediate access. The period is extended by each day immediate access or utilities are unavailable through seller's failure to provide them.`);
  paragraph('Buyer may conduct nondestructive inspections at buyer\'s expense, including inspections of structure, systems, wood-destroying insects, utilities, title-related matters, insurance, flood classification, zoning, restrictive covenants and matters in the seller disclosure. Before the period ends, buyer may either terminate in writing and obtain return of the deposit or deliver one complete signed written list of deficiencies and desired remedies to seller.');
  paragraph('Seller has 72 hours after receiving a timely buyer request to give a signed written response. If seller does not respond, buyer has 72 hours after seller\'s response was due to accept the property as is or terminate in writing; failure to make that choice ends this agreement with return of the deposit. If seller timely refuses any requested remedy, buyer has 72 hours after receipt of that response, or after the response was due if earlier, to accept the response, accept the property as is, or terminate in writing with return of the deposit. Failure to respond in that period ends this agreement with return of the deposit. Absent timely written termination or written request before the inspection period expires, buyer accepts the property\'s current condition. Any further remedy requires a separate written agreement.');

  section('5 | Appraisal and private systems');
  detail('Appraisal contingency', c.appraisal
    ? `Conditioned on an appraisal at least equal to the price. If lower, buyer delivers the appraisal and a written price-reduction request within ${d.appraisalCopyDays} calendar days of receipt. Within ${d.appraisalResponseDays} calendar days after seller receives that documentation, buyer may pay the original price or void the agreement unless seller agrees in writing to reduce the price or both parties agree to a new price.`
    : 'The sale is not conditioned on an appraisal.');
  detail('Private water systems serving the main residence', String(c.privateWaterSystems));
  detail('Private septic or treatment systems serving the main residence', String(c.privateSepticSystems));
  if (c.privateWaterSystems > 0 || c.privateSepticSystems > 0) {
    paragraph('Any agreed private water or sewerage inspection and remedy obligations require a separately signed addendum identifying the systems covered. The parties should attach that addendum before signing this agreement.');
  }

  section('6 | Sale warranties');
  if (c.warranty === 'with_warranties') {
    paragraph('The parties elect a sale with seller warranties, including remedies for redhibition under Louisiana Civil Code article 2520 and following articles.');
  } else if (c.warranty === 'as_is') {
    paragraph('The parties elect an as-is sale without seller warranties. Buyer waives and releases seller from claims for redhibition and reduction of price under Louisiana Civil Code articles 2520, 2541 and following articles, and acknowledges that seller gives no warranty of fitness for ordinary or particular use under article 2524. The parties agree to include this election in the Act of Sale.');
  } else {
    paragraph('For qualifying new construction, the parties elect the Louisiana New Home Warranty Act, La. R.S. 9:3141 and following, in place of either other warranty election.');
  }
  detail('Home service warranty', c.homeServiceWarranty === 'will'
    ? `Purchased at closing; maximum cost ${dollars(c.homeServiceWarrantyCostInCents)}; paid by ${c.homeServiceWarrantyPayer}; ordered by ${c.homeServiceWarrantyOrderedBy}.`
    : 'None will be purchased at closing.');
  paragraph('A home service plan does not warrant pre-existing defects and does not replace inspections or obligations otherwise imposed by this agreement.');

  section('7 | Act of Sale, possession and title');
  detail('Act of Sale date', readableDate(d.settlementDate));
  paragraph('The Act of Sale shall be executed before a settlement agent or notary chosen by buyer on the stated date, or earlier by written mutual agreement. Any change to that date must be in writing and signed by both parties. Buyer provides good funds at closing. Keys, access and possession transfer at the Act of Sale unless the parties separately agree otherwise in writing.');
  paragraph('Current-year property taxes, assumed flood insurance premiums, rents, assessments and association or condominium charges shall be prorated through the Act of Sale. Buyer pays Act of Sale, title search, title insurance and financing costs unless the parties agree otherwise in writing. Seller pays prior-year charges, seller closing fees, and the certificates or cancellations needed to convey title, unless otherwise agreed in writing.');
  paragraph(`Seller shall deliver merchantable title at seller's cost. If curative work is needed, the Act of Sale deadline extends by no more than ${d.titleCureDays} calendar days. Seller shall make good faith efforts to clear liens and encumbrances that cannot be satisfied at closing. If seller cannot deliver merchantable title within that period, buyer may demand return of the deposit and actual sale-processing costs and legal fees as allowed by the agreement and law.`);
  paragraph('Buyer may make a final walk-through within five calendar days before the Act of Sale or occupancy, whichever comes first, to confirm substantially the same or better condition and completion of agreed repairs. Seller shall provide access and utilities.');

  section('8 | Disclosure and separate documents');
  detail('Seller property disclosure', t.disclosures.propertyDisclosureStatus === 'received'
    ? 'Buyer acknowledges receipt of the seller-signed Louisiana Property Disclosure Document before this offer.'
    : 'Receipt has not been acknowledged. This version must not be submitted.');
  detail('Federal lead packet', t.disclosures.leadPaintStatus === 'built_1978_or_later'
    ? 'Listing records show the home was built in 1978 or later.'
    : t.disclosures.leadPaintStatus === 'received'
      ? `Buyer acknowledges the seller disclosure packet, records and pamphlet; inspection opportunity: ${t.disclosures.leadInspectionSelection === 'other_period' ? `${t.disclosures.leadInspectionDays} days` : t.disclosures.leadInspectionSelection.replace(/_/g, ' ')}.`
      : 'Lead status unresolved; do not sign this version.');
  paragraph('Seller disclosures and applicable federal forms remain separate signed documents. They do not constitute warranties or replace a buyer inspection. Each party should retain the documents actually delivered with this offer version.');
  paragraph('Information about mold is available from the EPA at https://www.epa.gov/mold. Flood-hazard maps are available from FEMA at https://msc.fema.gov/portal/home. Louisiana State Police provides a public sex-offender registry at https://lsp.org/community-outreach/sex-offender-registry/. These links provide information; they do not substitute for due diligence.');

  section('9 | Default, notices and entire agreement');
  paragraph('If seller defaults, buyer may seek termination, specific performance or termination with stipulated damages equal to ten percent of the sale price, together with return of the deposit. If buyer defaults, seller may seek termination, specific performance or termination with stipulated damages equal to ten percent of the sale price, and may claim the deposit. The prevailing party in an action to enforce this agreement may seek attorney fees and costs as stated here, subject to applicable law.');
  paragraph('Notices, requests, claims and elections under this agreement must be in writing. They may be delivered by mail, hand delivery, overnight delivery, email or the electronic signature service to the contact addresses recorded with this offer, unless a party changes its address by written notice. Both parties authorize electronic delivery and electronic signatures for this offer and its written addenda.');
  paragraph('Louisiana law governs this agreement. This document and any expressly incorporated, signed addenda state the entire agreement. Changes, extensions and counteroffers require a written version signed by the parties. Time is of the essence. Unless a different time is expressly stated, calendar-day deadlines end at 11:59 p.m. Louisiana local time.');
  detail('Additional terms agreed for this version', t.additionalTerms || 'None');

  section('10 | Offer, acceptance and signatures');
  const expiry = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago',
  }).format(new Date(t.delivery.expiresAt));
  detail('Offer expires', `${expiry} Louisiana local time`);
  paragraph('The offering party makes this offer until the expiration shown above. A binding agreement requires written acceptance and communication of acceptance to the offering party by that deadline. A rejected or changed proposal must be recorded as a new written counteroffer. Read all terms and attached documents before signing.');
  detail('Offering party', offeredBy.map(person => person.legalName).join('; '));
  detail('Receiving party', recipient.map(person => person.legalName).join('; '));
  for (const { side, person } of parties) {
    detail(`${side} - ${person.legalName}`, `${person.email} | ${person.phone} | ${signedAt(person)}`);
    if (person.signature.status === 'signed') {
      paragraph(`Electronically signed by ${person.legalName} (${side.toLowerCase()}) on ${signedAt(person)}.`, 9, BLUE);
    }
  }
  paragraph('NavStreet records each electronic signature and timestamp against this immutable offer version. The final signed agreement should be read together with the attachments and signed amendments identified in its transaction record.', 9, MUTED);

  const pages = pdf.getPages();
  pages.forEach((current, index) => {
    current.drawRectangle({ x: LEFT, y: 48, width: WIDTH, height: 0.8, color: TEAL });
    current.drawText(`${offer.referenceNumber}  |  Version ${version.versionNumber}`, {
      x: LEFT, y: 32, font: regular, size: 8, color: MUTED,
    });
    const counter = `Page ${index + 1} of ${pages.length}`;
    current.drawText(counter, {
      x: PAGE_W - LEFT - regular.widthOfTextAtSize(counter, 8),
      y: 32, font: regular, size: 8, color: MUTED,
    });
  });

  return {
    buffer: Buffer.from(await pdf.save()),
    fileName: `NavStreet-LA-${offer.referenceNumber}-v${version.versionNumber}.pdf`,
    pageCount: pages.length,
  };
}
