import {
  StateDisclosureRequirement
} from '../domains/disclosures/models/state-disclosure-requirement.model';
import { STATES } from './states.config';

export const STATE_DISCLOSURE_REQUIREMENTS:
  Readonly<
    Record<
      string,
      readonly StateDisclosureRequirement[]
    >
  > = {
    FL: [
      {
        description: 'Complete the Florida statutory flood disclosure before the buyer signs. Download the printable form below.',
        documentType: 'florida-flood-disclosure', formCode: 'FLA. STAT. 689.302',
        formDownloadUrl: '/forms/navstreet-florida-flood-disclosure.pdf',
        officialFormUrl: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0689/Sections/0689.302.html',
        required: true, shortTitle: 'Flood disclosure', sortOrder: 1, title: 'Florida seller flood disclosure',
      },
      {
        description: 'Upload the seller-signed statement of known material property defects, including any known sanitary sewer lateral defects. Florida law does not mandate one universal seller condition form.',
        documentType: 'florida-seller-property-disclosure', formCode: 'FL-SELLER-CONDITION',
        formDownloadUrl: '/forms/navstreet-florida-seller-condition-statement.pdf',
        officialFormUrl: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0689/Sections/0689.301.html',
        required: false, shortTitle: 'Property condition', sortOrder: 2, title: 'Seller property condition statement',
      },
      {
        description: 'If mandatory association membership applies, provide the seller-completed statutory disclosure summary before the buyer signs.',
        documentType: 'florida-hoa-disclosure-summary', formCode: 'FLA. STAT. 720.401',
        formDownloadUrl: '/forms/navstreet-florida-hoa-disclosure-summary.pdf',
        officialFormUrl: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0720/Sections/0720.401.html',
        required: false, shortTitle: 'HOA summary', sortOrder: 3, title: 'Florida homeowners association disclosure summary',
      },
      {
        description: 'For most homes built before 1978, provide the signed seller lead disclosure, available records and EPA pamphlet before the buyer signs.',
        documentType: 'lead-based-paint', formCode: 'FED-LEAD',
        formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
        officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        required: false, shortTitle: 'Lead paint', sortOrder: 4, title: 'Lead-based paint disclosure',
      },
    ],
    LA: [
      {
        description: 'Download the LREC 2026 Property Disclosure Document, complete the applicable pages (including its exemption section when legally applicable), sign it, and upload it here. NavStreet will not accept an offer until the buyer can access this upload.',
        documentType: 'louisiana-property-disclosure',
        formCode: 'LREC PROPERTY DISCLOSURE 01/2026',
        formDownloadUrl: '/forms/lrec-louisiana-property-disclosure-2026.pdf',
        officialFormUrl: 'https://lrec.gov/form-categories/mandatory',
        required: true,
        shortTitle: 'Louisiana property disclosure',
        sortOrder: 1,
        title: 'Louisiana Property Disclosure Document (seller signed)',
      },
      {
        description: 'For most pre-1978 homes, provide the signed federal lead seller disclosure, available records and EPA pamphlet before the buyer signs.',
        documentType: 'lead-based-paint',
        formCode: 'FED-LEAD',
        formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
        required: false,
        shortTitle: 'Lead-based paint',
        sortOrder: 2,
        title: 'Lead-based paint packet',
      },
    ],
    NC: [
      {
        description:
          'Upload the completed and signed North Carolina Residential Property and Owners’ Association Disclosure Statement.',
        documentType:
          'residential-property-owners-association',
        formCode: 'REC 4.22',
        officialFormUrl:
          'https://www.ncrec.gov/Forms/Consumer/rec422.pdf',
        formDownloadUrl: 'https://www.ncrec.gov/Forms/Consumer/rec422.pdf',
        required: true,
        shortTitle: 'Property Disclosure',
        sortOrder: 1,
        title:
          'Residential Property and Owners’ Association Disclosure'
      },
      {
        description:
          'Upload the completed and signed North Carolina Mineral and Oil and Gas Rights Mandatory Disclosure Statement.',
        documentType:
          'mineral-oil-gas-rights',
        formCode: 'REC 4.25',
        officialFormUrl:
          'https://www.ncrec.gov/Forms/Consumer/rec425.pdf',
        formDownloadUrl: 'https://www.ncrec.gov/Forms/Consumer/rec425.pdf',
        required: true,
        shortTitle:
          'Mineral, Oil and Gas Disclosure',
        sortOrder: 2,
        title:
          'Mineral and Oil and Gas Rights Mandatory Disclosure Statement'
      },
      {
        description: 'For most pre-1978 homes, provide the signed lead disclosure, available reports and the EPA pamphlet.',
        documentType: 'lead-based-paint',
        formCode: 'FED-LEAD',
        officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
        required: false,
        shortTitle: 'Lead paint',
        sortOrder: 3,
        title: 'Lead-Based Paint Seller Disclosure',
      }
    ],
    OK: [
      {
        description: 'For a covered sale, complete and sign the Oklahoma residential property condition disclosure statement when applicable.',
        documentType: 'oklahoma-property-condition-disclosure',
        formCode: 'OREC Appendix A (2026)',
        officialFormUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Appendix%20A%20Residential%20Property%20Condition.pdf',
        formDownloadUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Appendix%20A%20Residential%20Property%20Condition.pdf',
        required: false,
        shortTitle: 'Condition disclosure',
        sortOrder: 1,
        title: 'Oklahoma Property Condition Disclosure Statement',
      },
      {
        description: 'Use the disclaimer instead of Appendix A only when permitted by Oklahoma law.',
        documentType: 'oklahoma-property-condition-disclaimer',
        formCode: 'OREC Appendix B (2026)',
        officialFormUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Appendix%20B%20RPC%20Disclaimer.pdf',
        formDownloadUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Appendix%20B%20RPC%20Disclaimer.pdf',
        required: false,
        shortTitle: 'Condition disclaimer',
        sortOrder: 2,
        title: 'Oklahoma Property Condition Disclaimer Statement',
      },
      {
        description: 'Use this form only when the property transfer qualifies for an exemption.',
        documentType: 'oklahoma-property-condition-exemption',
        formCode: 'OREC RPCD Exemption (2026)',
        officialFormUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20RPCD%20Exemption%20Form.pdf',
        formDownloadUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20RPCD%20Exemption%20Form.pdf',
        required: false,
        shortTitle: 'Exemption',
        sortOrder: 3,
        title: 'Oklahoma Property Condition Exemption',
      },
      {
        description: 'For most homes built before 1978, provide the signed lead disclosure, available reports, and EPA pamphlet.',
        documentType: 'lead-based-paint',
        formCode: 'FED-LEAD',
        officialFormUrl: 'https://oklahoma.gov/orec/contract-forms-and-related-addenda.html',
        formDownloadUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Lead-Based%20Paint%20Seller%20Disclosure.pdf',
        additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
        required: false,
        shortTitle: 'Lead paint',
        sortOrder: 4,
        title: 'Lead-Based Paint Seller Disclosure',
      },
    ],
    UT: [
      {
        description: 'Upload a seller-completed property condition statement if agreed in the contract. This is a contractual choice, not a universal Utah statutory form.',
        documentType: 'utah-seller-property-condition',
        formCode: 'UT-SELLER-CONDITION',
        formDownloadUrl: '/forms/navstreet-utah-seller-condition-statement.pdf',
        required: false,
        shortTitle: 'Property condition',
        sortOrder: 1,
        title: 'Utah seller property condition statement',
      },
      {
        description: 'For most homes built before 1978, upload the signed lead disclosure and deliver available reports and the EPA pamphlet before the contract is signed.',
        documentType: 'lead-based-paint',
        formCode: 'FED-LEAD',
        officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
        required: false,
        shortTitle: 'Lead paint',
        sortOrder: 2,
        title: 'Lead-based paint disclosure',
      },
      {
        description: 'For property in an owners association, upload its recorded governing documents and provide the required homeowner education materials before closing.',
        documentType: 'utah-hoa-governing-documents',
        formCode: 'UT-HOA-DOCS',
        sourceInstructions: 'Request the governing documents from the association or county recorder; they are specific to this property.',
        required: false,
        shortTitle: 'Association documents',
        sortOrder: 3,
        title: 'Utah association governing documents',
      },
      {
        description: 'When you know the property is currently contaminated from methamphetamine use, storage, or manufacture, disclose that condition to the buyer.',
        documentType: 'utah-methamphetamine-contamination',
        formCode: 'UT-METH-DISCLOSURE',
        formDownloadUrl: '/forms/navstreet-utah-methamphetamine-disclosure.pdf',
        officialFormUrl: 'https://le.utah.gov/xcode/Title57/Chapter27/57-27-S201.html',
        required: false,
        shortTitle: 'Contamination',
        sortOrder: 4,
        title: 'Current methamphetamine contamination disclosure',
      },
    ],
    WI: [
      {
        description: 'Upload the completed and seller-signed Wisconsin real estate condition report. The report must contain all information required by current Wis. Stat. § 709.03; upload changes as new versions.',
        documentType: 'wisconsin-real-estate-condition-report',
        formCode: 'WIS. STAT. 709.03',
        officialFormUrl: 'https://docs.legis.wisconsin.gov/document/statutes/709.03',
        sourceInstructions: 'The current statute contains the full report. Open it, use Print → Save as PDF for a copy, complete every applicable item, and upload the signed report. Do not substitute a short condition checklist.',
        required: true,
        shortTitle: 'Condition report',
        sortOrder: 1,
        title: 'Wisconsin Real Estate Condition Report',
      },
      {
        description: 'For most pre-1978 housing, upload the signed lead disclosure, provide available records, and deliver the EPA pamphlet before the buyer is bound.',
        documentType: 'lead-based-paint',
        formCode: 'FED-LEAD',
        officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
        required: false,
        shortTitle: 'Lead disclosure',
        sortOrder: 2,
        title: 'Lead-Based Paint Disclosure',
      },
      {
        description: 'If the property is in an owners association, provide any applicable recorded covenants and association documents.',
        documentType: 'wisconsin-association-documents',
        formCode: 'WI-ASSOCIATION-DOCS',
        sourceInstructions: 'Request the recorded covenants and governing documents from the association or county register of deeds; these are property-specific.',
        required: false,
        shortTitle: 'Association documents',
        sortOrder: 3,
        title: 'Wisconsin Association Documents',
      },
    ],
    TX: [
      {
        description:
          'Upload the completed Texas Seller’s Disclosure Notice when the property is not exempt from the statutory disclosure requirement.',
        documentType:
          'texas-seller-disclosure-notice',
        formCode: 'TREC 55-1 (2026)',
        officialFormUrl:
          'https://www.trec.texas.gov/forms/sellers-disclosure-notice',
        formDownloadUrl: 'https://www.trec.texas.gov/sites/default/files/pdf-forms/55-1.pdf',
        required: true,
        shortTitle: 'Seller Disclosure',
        sortOrder: 1,
        title: 'Texas Seller’s Disclosure Notice'
      },
      {
        description: 'For most pre-1978 homes, provide the signed lead disclosure, available reports and the EPA pamphlet.',
        documentType: 'lead-based-paint',
        formCode: 'FED-LEAD',
        officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
        additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
        required: false,
        shortTitle: 'Lead paint',
        sortOrder: 2,
        title: 'Lead-Based Paint Seller Disclosure',
      }
    ]
  };

export function getStateDisclosureRequirements(
  stateAbbreviation: string
): readonly StateDisclosureRequirement[] {
  return STATE_DISCLOSURE_REQUIREMENTS[
    normalizeDisclosureStateCode(stateAbbreviation)
  ] ?? [];
}

/** Use listing answers when a form is conditional; keep other states' rules unchanged. */
export function isDisclosureRequiredForListing(
  state: string,
  requirement: StateDisclosureRequirement,
  listing: { ownersAssociationApplies?: boolean | null; leadBasedPaintApplies?: boolean | null; yearBuilt?: number | null }
): boolean {
 if (requirement.required) return true;

const stateCode = normalizeDisclosureStateCode(state);

if (stateCode === 'LA') {
  return requirement.documentType === 'lead-based-paint' &&
    (
      listing.leadBasedPaintApplies === true ||
      listing.yearBuilt == null ||
      listing.yearBuilt < 1978
    );
}
if (stateCode !== 'FL') return false;
  return (requirement.documentType === 'florida-hoa-disclosure-summary' && listing.ownersAssociationApplies === true) ||
    (requirement.documentType === 'lead-based-paint' &&
      (listing.leadBasedPaintApplies === true ||
        (typeof listing.yearBuilt === 'number' && listing.yearBuilt < 1978 && listing.leadBasedPaintApplies !== false)));
}

/** Accept both the two-letter code and the full name stored on older listings. */
export function normalizeDisclosureStateCode(state: string): string {
  const normalized = state.trim().toLowerCase();
  const stateConfiguration = STATES.find(
    candidate =>
      candidate.abbreviation.toLowerCase() === normalized ||
      candidate.name.toLowerCase() === normalized
  );

  return stateConfiguration?.abbreviation ?? state.trim().toUpperCase();
}