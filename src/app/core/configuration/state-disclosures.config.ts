import {
  StateDisclosureRequirement
} from '../domains/disclosures/models/state-disclosure-requirement.model';

export const STATE_DISCLOSURE_REQUIREMENTS:
  Readonly<
    Record<
      string,
      readonly StateDisclosureRequirement[]
    >
  > = {
    NC: [
      {
        description:
          'Upload the completed and signed North Carolina Residential Property and Owners’ Association Disclosure Statement.',
        documentType:
          'residential-property-owners-association',
        formCode: 'REC 4.22',
        officialFormUrl:
          'https://www.ncrec.gov/Forms/Consumer/rec422.pdf',
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
        required: true,
        shortTitle:
          'Mineral, Oil and Gas Disclosure',
        sortOrder: 2,
        title:
          'Mineral and Oil and Gas Rights Mandatory Disclosure Statement'
      }
    ],
    UT: [
      {
        description: 'Upload a seller-completed property condition statement if agreed in the contract. This is a contractual choice, not a universal Utah statutory form.',
        documentType: 'utah-seller-property-condition',
        formCode: 'UT-SELLER-CONDITION',
        required: false,
        shortTitle: 'Property condition',
        sortOrder: 1,
        title: 'Utah seller property condition statement',
      },
      {
        description: 'For most homes built before 1978, upload the signed lead disclosure and deliver available reports and the EPA pamphlet before the contract is signed.',
        documentType: 'lead-based-paint',
        formCode: 'FED-LEAD',
        officialFormUrl: 'https://www.epa.gov/lead/lead-based-paint-disclosure-rule-section-1018-title-x',
        required: false,
        shortTitle: 'Lead paint',
        sortOrder: 2,
        title: 'Lead-based paint disclosure',
      },
      {
        description: 'For property in an owners association, upload its recorded governing documents and provide the required homeowner education materials before closing.',
        documentType: 'utah-hoa-governing-documents',
        formCode: 'UT-HOA-DOCS',
        required: false,
        shortTitle: 'Association documents',
        sortOrder: 3,
        title: 'Utah association governing documents',
      },
      {
        description: 'When you know the property is currently contaminated from methamphetamine use, storage, or manufacture, disclose that condition to the buyer.',
        documentType: 'utah-methamphetamine-contamination',
        formCode: 'UT-METH-DISCLOSURE',
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
        required: true,
        shortTitle: 'Condition report',
        sortOrder: 1,
        title: 'Wisconsin Real Estate Condition Report',
      },
      {
        description: 'For most pre-1978 housing, upload the signed lead disclosure, provide available records, and deliver the EPA pamphlet before the buyer is bound.',
        documentType: 'lead-based-paint',
        formCode: 'FED-LEAD',
        officialFormUrl: 'https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards',
        required: false,
        shortTitle: 'Lead disclosure',
        sortOrder: 2,
        title: 'Lead-Based Paint Disclosure',
      },
      {
        description: 'If the property is in an owners association, provide any applicable recorded covenants and association documents.',
        documentType: 'wisconsin-association-documents',
        formCode: 'WI-ASSOCIATION-DOCS',
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
        formCode: 'TREC OP-H',
        officialFormUrl:
          'https://www.trec.texas.gov/sites/default/files/pdf-forms/OP-H.pdf',
        required: true,
        shortTitle: 'Seller Disclosure',
        sortOrder: 1,
        title: 'Texas Seller’s Disclosure Notice'
      }
    ]
  };

export function getStateDisclosureRequirements(
  stateAbbreviation: string
): readonly StateDisclosureRequirement[] {
  return STATE_DISCLOSURE_REQUIREMENTS[
    stateAbbreviation.trim().toUpperCase()
  ] ?? [];
}
