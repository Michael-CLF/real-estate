import {
  StateDisclosureRequirement
} from '../domains/disclosures/state-disclosure-requirement.model';

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
    ]
  };

export function getStateDisclosureRequirements(
  stateAbbreviation: string
): readonly StateDisclosureRequirement[] {
  return STATE_DISCLOSURE_REQUIREMENTS[
    stateAbbreviation.trim().toUpperCase()
  ] ?? [];
}