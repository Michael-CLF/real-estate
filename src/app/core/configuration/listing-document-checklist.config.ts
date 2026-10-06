import { californiaDisclosureOutstanding, type CaliforniaListingFacts } from '../domains/listings/state-packages/california/california-listing-facts.model';
import { getStateDisclosureRequirements, normalizeDisclosureStateCode } from './state-disclosures.config';
import { STATES } from './states.config';
import type { DisclosureDocumentType } from '../domains/disclosures/models/state-disclosure-requirement.model';

export interface ListingChecklistItem {
  readonly id: string;
  readonly title: string;
  readonly category: 'Required when applicable' | 'Contract requirement' | 'Information booklet' | 'Recommended';
  readonly applicability: string;
  readonly timing: string;
  readonly instructions: string;
  readonly suppliedBy: string;
  readonly links: readonly { readonly label: string; readonly url: string }[];
}

type ChecklistGuidance = Omit<ListingChecklistItem, 'id' | 'title' | 'links'>;

export const LISTING_CHECKLIST_STATES = STATES.filter(state =>
  state.isActive && getStateDisclosureRequirements(state.abbreviation).length > 0,
);

// Presentation guidance only. Do not use these labels as upload or publication gates.
const GUIDANCE: Partial<Record<DisclosureDocumentType, ChecklistGuidance>> = {
  ...Object.fromEntries(getStateDisclosureRequirements('SC').filter(r=>r.documentType!=='lead-based-paint').map(r=>[r.documentType,{
    category:'Required when applicable' as const, applicability:'South Carolina residential sale; property-specific conditions and lawful exemptions determine applicability.',
    timing:r.documentType==='south-carolina-property-condition'?'Before signing or by the delivery date expressly agreed in the contract.':r.documentType==='south-carolina-vacation-rentals'?'Disclose all future rental periods before ratification.':r.documentType==='south-carolina-coastal-disclosure'?'Include required beachfront information in the purchase contract.':'Provide at the applicable agreed stage.',
    instructions:r.description,suppliedBy:'Seller, with association, survey or property records as applicable',
  }])),

  ...Object.fromEntries(
    getStateDisclosureRequirements('CA')
      .filter(requirement =>
        requirement.documentType !== 'lead-based-paint'
      )
      .map(requirement => [
        requirement.documentType,
        {
          category:
            requirement.documentType ===
              'california-earthquake-environmental-guides'
              ? 'Information booklet' as const
              : 'Required when applicable' as const,

          applicability:
            'California residential resale; applicability depends on the property and any valid exemption.',

          timing:
            'Provide promptly at the applicable legal or agreed stage. Uploading a document does not establish buyer receipt.',

          instructions:
            requirement.description,

          suppliedBy:
            'Seller, with applicable association, local or property records',
        },
      ])
  ),
  'residential-property-owners-association': {
    category: 'Required when applicable', applicability: 'Covered North Carolina residential transfers; statutory exemptions and permitted waivers may apply.',
    timing: 'Provide to the buyer no later than the buyer makes an offer.', suppliedBy: 'Seller',
    instructions: 'Complete and sign the official property and association disclosure. A no-representation answer is different from an exemption. Confirm exemptions for this form separately from the mineral form.',
  },
  'mineral-oil-gas-rights': {
    category: 'Required when applicable', applicability: 'Covered North Carolina transfers. Some exemptions for the property disclosure do not exempt this form.',
    timing: 'Provide to the buyer no later than the buyer makes an offer.', suppliedBy: 'Seller',
    instructions: 'Complete and sign the official mineral, oil and gas rights disclosure, including required answers about your own severance or reservation of rights.',
  },
  'texas-seller-disclosure-notice': {
    category: 'Required when applicable', applicability: 'Covered previously occupied single-family residences; statutory exemptions may apply.',
    timing: 'Provide on or before the contract effective date. Late delivery can give the buyer termination rights.', suppliedBy: 'Seller',
    instructions: 'Complete and sign the current Seller’s Disclosure Notice. Use the official form page to confirm the current version. Additional property-specific notices may also apply.',
  },
  'oklahoma-property-condition-disclosure': {
    category: 'Required when applicable', applicability: 'Covered Oklahoma residential transfers using the disclosure route.',
    timing: 'Provide before accepting the buyer’s offer; follow the acknowledgment and confirmation rules if delivered after an offer.', suppliedBy: 'Seller',
    instructions: 'Complete Appendix A. This is one route: do not gather both the disclosure and disclaimer unless your circumstances require a replacement. The form must be no more than 180 days old when received.',
  },
  'oklahoma-property-condition-disclaimer': {
    category: 'Required when applicable', applicability: 'Alternative route only when you have never occupied the property and have no actual knowledge of a defect.',
    timing: 'Provide before accepting the buyer’s offer; follow the acknowledgment and confirmation rules if delivered after an offer.', suppliedBy: 'Seller',
    instructions: 'Use Appendix B only if legally eligible. If you learn of a defect before acceptance, provide the required disclosure instead. The form must be no more than 180 days old when received.',
  },
  'oklahoma-property-condition-exemption': {
    category: 'Required when applicable', applicability: 'Alternative route only for a transfer that qualifies for a statutory exemption.',
    timing: 'Confirm the exemption before relying on it in the offer process.', suppliedBy: 'Seller',
    instructions: 'Review the official exemption form and identify the actual exemption. Selecting this route does not establish eligibility or waive federal lead requirements.',
  },
  'utah-seller-property-condition': {
    category: 'Contract requirement', applicability: 'When the purchase agreement requires this seller statement.',
    timing: 'By the seller disclosure deadline agreed in the purchase agreement.', suppliedBy: 'Seller',
    instructions: 'Complete the agreed property condition statement. Utah does not require this particular form for every sale. Obligations to disclose known material conditions still apply.',
  },
  'utah-hoa-governing-documents': {
    category: 'Required when applicable', applicability: 'Property in an association; condominium and community association rules may differ.',
    timing: 'Provide applicable governing documents and the required homeowner education access before closing.', suppliedBy: 'Seller, with documents from the association',
    instructions: 'Request the recorded governing documents and homeowner education access point from the association. Gather assessment and contact information too.',
  },
  'utah-methamphetamine-contamination': {
    category: 'Required when applicable', applicability: 'You know the property is currently contaminated from methamphetamine use, storage or manufacture.',
    timing: 'Disclose in writing to the prospective buyer before sale.', suppliedBy: 'Seller',
    instructions: 'Disclose the known current contamination. Gather existing remediation or clearance records if available; this checklist does not require a new contamination test.',
  },
  'wisconsin-real-estate-condition-report': {
    category: 'Required when applicable', applicability: 'Covered Wisconsin residential transfers, subject to statutory exceptions and permitted waivers.',
    timing: 'Generally no later than 10 days after acceptance of the sale or option contract. Earlier delivery is useful.', suppliedBy: 'Seller',
    instructions: 'Complete and sign a report containing all items in the current statute. Keep amendments with the report. This legal timing does not make the report a universal prerequisite to publishing.',
  },
  'wisconsin-association-documents': {
    category: 'Required when applicable', applicability: 'Association or condominium property; the document package depends on the property and transaction.',
    timing: 'Applicable statutory delivery timing and agreed contract deadlines.', suppliedBy: 'Seller, with records from the association',
    instructions: 'Gather covenants and governing records. Condominium sales may require a separate statutory disclosure package and buyer cancellation notices; ask the association for the applicable resale package.',
  },
  'florida-flood-disclosure': {
    category: 'Required when applicable', applicability: 'Sale of Florida residential real property.',
    timing: 'At or before execution of the sales contract.', suppliedBy: 'Seller',
    instructions: 'Complete the statutory flood disclosure, including known flooding during your ownership, flood insurance claims and flood assistance. Use the current statutory language.',
  },
  'florida-seller-property-disclosure': {
    category: 'Required when applicable', applicability: 'Known material defects not readily observable to the buyer, including known sewer lateral defects.',
    timing: 'Disclose before the contract is executed.', suppliedBy: 'Seller',
    instructions: 'Disclose the known conditions. Florida does not require one universal seller condition form; a particular upload form is not itself a universal statutory requirement.',
  },
  'florida-hoa-disclosure-summary': {
    category: 'Required when applicable', applicability: 'Mandatory homeowners association membership under Chapter 720.',
    timing: 'Before the buyer executes the contract.', suppliedBy: 'Seller, with association information',
    instructions: 'Complete the statutory HOA summary with the association information. Condominium property has separate Chapter 718 disclosure requirements.',
  },
  'louisiana-property-disclosure': {
    category: 'Required when applicable', applicability: 'Covered Louisiana residential transfers; statutory exemptions may apply.',
    timing: 'No later than the buyer makes an offer. Late delivery can create buyer withdrawal or termination rights.', suppliedBy: 'Seller',
    instructions: 'Complete and sign the applicable current LREC property disclosure or a legally compliant equivalent. Include the required association and property-condition answers; confirm any exemption.',
  },
  'colorado-property-disclosure': {
    category: 'Contract requirement', applicability: 'When the purchase agreement calls for the seller property disclosure. Statutory radon and known-defect duties apply separately.',
    timing: 'By the agreed Seller’s Property Disclosure Deadline; provide required statutory disclosures at their applicable stage.', suppliedBy: 'Seller',
    instructions: 'Complete the current residential seller disclosure and its applicable property questions. The full form is not a universal statutory upload requirement for every owner selling directly.',
  },
  'colorado-radon-brochure': {
    category: 'Information booklet', applicability: 'Colorado residential real property sales.',
    timing: 'Provide with the required radon disclosure for the sale.', suppliedBy: 'Colorado Department of Public Health and Environment; seller delivers a copy',
    instructions: 'Use the most recent official radon and real estate brochure. It is an information booklet, not a form you complete or a requirement to order a new test.',
  },
  'colorado-association-documents': {
    category: 'Required when applicable', applicability: 'Common-interest community property.',
    timing: 'Follow applicable law and the Association Documents Deadline in the contract.', suppliedBy: 'Seller, with records from the association',
    instructions: 'Request applicable governing and financial records from the association. This is not a universal document requirement for homes outside an association.',
  },
  'lead-based-paint': {
    category: 'Required when applicable', applicability: 'Most housing built before 1978; federal exemptions must be confirmed.',
    timing: 'Provide the disclosures, available records and EPA pamphlet before the buyer signs the purchase contract.', suppliedBy: 'Seller supplies facts and available records; EPA publishes the pamphlet',
    instructions: 'Complete the seller disclosure, provide available lead records and deliver Protect Your Family From Lead in Your Home. Allow the required inspection opportunity unless changed or waived in writing. A new test is not required by this disclosure rule.',
  },
};

export function getListingDocumentChecklist(state: string): readonly ListingChecklistItem[] {
  const code = normalizeDisclosureStateCode(state);
  if (!LISTING_CHECKLIST_STATES.some(candidate => candidate.abbreviation === code)) return [];

  const items: ListingChecklistItem[] = getStateDisclosureRequirements(code)
    .slice().sort((a, b) => a.sortOrder - b.sortOrder)
    .map(requirement => {
      const guidance = GUIDANCE[requirement.documentType];
      const links: { label: string; url: string }[] = [];
      if (requirement.formDownloadUrl && requirement.documentType !== 'colorado-radon-brochure') {
        links.push({ label: requirement.formDownloadLabel ?? 'Open form', url: requirement.formDownloadUrl });
      }
      if (requirement.officialFormUrl) links.push({ label: 'Official source / current form', url: requirement.officialFormUrl });
      links.push(...(requirement.additionalDownloads ?? []));
      return {
        id: requirement.documentType, title: requirement.title,
        category: guidance?.category ?? 'Recommended',
        applicability: guidance?.applicability ?? 'Review applicability for your property and purchase agreement.',
        timing: guidance?.timing ?? 'Follow the applicable legal or agreed contract deadline.',
        instructions: guidance?.instructions ?? requirement.description,
        suppliedBy: guidance?.suppliedBy ?? 'Seller or document issuer', links,
      };
    });

  if (code === 'CO') items.push({
    id: 'colorado-radon-records', title: 'Known radon information and existing records', category: 'Required when applicable',
    applicability: 'Known radon information, tests, mitigation or remediation for the property.',
    timing: 'Include the required radon information in the sale disclosure / agreement.', suppliedBy: 'Seller',
    instructions: 'Gather existing test reports and information about any radon mitigation system. Disclose what you know; no new test is required just to create a listing.',
    links: [{ label: 'Colorado radon disclosure law', url: 'https://leg.colorado.gov/bills/sb23-206' }],
  });
  if (code === 'FL') items.push({
    id: 'florida-condominium-package', title: 'Condominium resale disclosure package', category: 'Required when applicable',
    applicability: 'Condominium property under Chapter 718.', timing: 'Follow Chapter 718 delivery and buyer cancellation rules.',
    suppliedBy: 'Seller, with records from the condominium association',
    instructions: 'Request the current resale package, including required governing, financial and inspection or reserve records where applicable. This is separate from a Chapter 720 HOA summary.',
    links: [{ label: 'Florida condominium resale requirements', url: 'https://www.flsenate.gov/Laws/Statutes/2026/718.503' }],
  });
  if (code === 'TX') items.push({
    id: 'texas-property-specific-notices', title: 'Association, district and other property-specific notices', category: 'Required when applicable',
    applicability: 'Association or condominium membership, special districts, or other conditions triggering a separate notice.',
    timing: 'Use the deadline prescribed for the applicable notice or agreed in the contract.', suppliedBy: 'Seller, association or district',
    instructions: 'Gather applicable association resale information and district notices. These are separate from the Seller’s Disclosure Notice; not every property needs the same package.',
    links: [{ label: 'Texas official forms and notices', url: 'https://www.trec.texas.gov/forms' }],
  });
  items.push({
    id: 'supporting-property-records', title: 'Helpful property records', category: 'Recommended',
    applicability: 'Gather records you already have; additional requirements depend on the property and contract.',
    timing: 'Prepare early; deliver when required by law or the purchase agreement.', suppliedBy: 'Seller, county records, association or service provider',
    instructions: 'Deed or legal description, survey, existing leases, warranties, permits, repair records and existing inspection reports can help you answer listing questions. This checklist does not require ordering new reports or uploading every record.',
    links: [],
  });
  return items;
}

export interface ListingChecklistFacts {
  readonly california?: CaliforniaListingFacts;
  readonly yearBuilt?: number | null;
  readonly propertyType?: string | null;
  readonly leadBasedPaintApplies?: boolean | null;
  readonly ownersAssociationApplies?: boolean | null;
  readonly methamphetamineContaminationKnown?: boolean | null;
}

/** Mirrors the supplied offer-creation gates for messaging; never enforces a gate. */
export function getOfferBlockingDocumentTypes(state: string, facts: ListingChecklistFacts, now = Date.now()): readonly DisclosureDocumentType[] {
  const code = normalizeDisclosureStateCode(state);
  const lead = facts.leadBasedPaintApplies === true;
  const old = typeof facts.yearBuilt === 'number' && facts.yearBuilt < 1978;
  if (code === 'CA') return californiaDisclosureOutstanding(facts.california?.disclosureApplicability, new Set()) as DisclosureDocumentType[];
  if (code === 'FL') return [
    'florida-flood-disclosure',
    ...(facts.ownersAssociationApplies === true ? ['florida-hoa-disclosure-summary' as const] : []),
    ...(lead || (old && facts.leadBasedPaintApplies !== false) ? ['lead-based-paint' as const] : []),
  ];
  if (code === 'LA') {
    if (facts.propertyType === 'land') return now >= Date.parse('2027-01-01T06:00:00Z')
      ? ['louisiana-vacant-residential-property-disclosure'] : [];
    return ['louisiana-property-disclosure', ...(facts.yearBuilt == null || old || lead ? ['lead-based-paint' as const] : [])];
  }
  if (code === 'CO') return ['colorado-property-disclosure', 'colorado-radon-brochure',
    ...(facts.yearBuilt == null || old || lead ? ['lead-based-paint' as const] : [])];
  return [];
}

export function checklistDocumentTitle(state: string, type: DisclosureDocumentType): string {
  return getStateDisclosureRequirements(state).find(item => item.documentType === type)?.title ??
    (type === 'louisiana-vacant-residential-property-disclosure' ? 'Louisiana vacant residential property disclosure' : type.replace(/-/g, ' '));
}

export function checklistApplicability(id: string, facts: ListingChecklistFacts): string {
  if (id === 'lead-based-paint') {
    if (facts.leadBasedPaintApplies === true || (facts.yearBuilt != null && facts.yearBuilt < 1978)) return 'Pre-1978 / lead disclosure: confirm any federal exemption';
    if (facts.yearBuilt != null && facts.yearBuilt >= 1978) return 'Generally not applicable: built in 1978 or later';
    return 'Confirm construction year in Property Details';
  }
  if (id.includes('association') || id.includes('hoa-')) {
    if (facts.ownersAssociationApplies === false) return 'No association reported; confirm any condominium requirements separately';
    if (facts.ownersAssociationApplies === true) return 'Association reported: review applicable documents';
    return 'Confirm association membership in Property Details';
  }
  if (id === 'utah-methamphetamine-contamination') {
    return facts.methamphetamineContaminationKnown === true ? 'Known contamination reported: disclosure applies' :
      facts.methamphetamineContaminationKnown === false ? 'No known current contamination reported' : 'Confirm known contamination in Property Details';
  }
  return '';
}

export function getChecklistRestrictionMessages(state: string, facts: ListingChecklistFacts): readonly string[] {
  const code = normalizeDisclosureStateCode(state);
  if (code === 'CA') return ['You may create and publish your listing while gathering disclosures. Buyers can start an offer after applicable required documents are uploaded. Save any exemption or non-applicability explanation on the existing Property Disclosures page.'];
  const blocking = getOfferBlockingDocumentTypes(code, facts);
  const messages: string[] = [];
  if (blocking.length) messages.push('NavStreet currently prevents buyers from starting or submitting an offer while these uploads are missing: ' +
    blocking.map(type => checklistDocumentTitle(code, type)).join('; ') + '.');
  if (code === 'FL' && facts.ownersAssociationApplies == null) messages.push('If mandatory HOA membership applies, the HOA disclosure summary upload is also required before buyers can start an offer.');
  if (code === 'FL' && facts.yearBuilt == null) messages.push('For applicable pre-1978 housing, the lead disclosure upload is also required before buyers can start an offer. Confirm the year and applicability in Property Details.');
  if (['CO', 'LA'].includes(code) && facts.propertyType !== 'land' && facts.yearBuilt == null) messages.push('The current offer check treats an unknown construction year as needing the lead packet. Confirm the construction year in Property Details.');
  if (code === 'CO') messages.push('The current NavStreet offer check requires the full seller property disclosure and a radon brochure upload. The brochure is an official information booklet; you do not complete it or order a new radon test for this checklist.');
  if (['UT', 'WI'].includes(code)) messages.push('If a buyer marks a disclosure as received, its uploaded document version must be available before the offer can be submitted. A pending document remains subject to its legal and agreed contract deadline.');
  if (['NC', 'LA'].includes(code) && facts.propertyType !== 'land') messages.push('Provide the applicable seller disclosure statements no later than the buyer makes an offer. Confirm any statutory exemption before relying on it.');
  if (code === 'TX') messages.push('Provide the applicable Seller’s Disclosure Notice by the contract effective date. Late delivery can give the buyer termination rights.');
  if (code === 'OK') messages.push('Provide the applicable disclosure or legally eligible disclaimer before accepting an offer. If delivered after an offer, obtain the buyer’s required acknowledgment and confirmation before acceptance.');
  if (!(facts.yearBuilt != null && facts.yearBuilt >= 1978 && facts.leadBasedPaintApplies !== true)) messages.push('For most housing built before 1978, the lead disclosure, available records and EPA pamphlet must be delivered before the buyer signs the purchase contract. Confirm any federal exemption.');
  return messages;
}
