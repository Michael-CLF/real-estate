export type TexasContractType =
  | 'one_to_four_family_resale'
  | 'condominium_resale'
  | 'new_home_completed'
  | 'new_home_incomplete'
  | 'farm_and_ranch'
  | 'unimproved_property';


export interface TexasContractDefinition {
  readonly stateCode: 'TX';
  readonly contractType: TexasContractType;
  readonly formId: string;
  readonly formName: string;
  readonly effectiveDate: string;
  readonly revisionDate: string;
  readonly pageCount: number;
  readonly officialPdfFileName: string;
  readonly officialPdfUrl: string;
}


/*
 * This catalog identifies the exact TREC forms used by the Texas
 * implementation. The PDF file name and form version are persisted
 * with generated documents so a later TREC revision cannot silently
 * change an existing offer version.
 */
export const TEXAS_CONTRACT_CATALOG:
  Readonly<
    Record<
      TexasContractType,
      TexasContractDefinition
    >
  > = {
    one_to_four_family_resale: {
      stateCode: 'TX',
      contractType:
        'one_to_four_family_resale',
      formId: '20-19',
      formName:
        'One to Four Family Residential Contract (Resale)',
      effectiveDate: '2026-07-01',
      revisionDate: '2026-05-04',
      pageCount: 12,
      officialPdfFileName: '20-19_4.pdf',
      officialPdfUrl:
        'https://www.trec.texas.gov/sites/default/files/pdf-forms/20-19_4.pdf',
    },

    condominium_resale: {
      stateCode: 'TX',
      contractType:
        'condominium_resale',
      formId: '30-18',
      formName:
        'Residential Condominium Contract (Resale)',
      effectiveDate: '2026-07-01',
      revisionDate: '2026-05-04',
      pageCount: 10,
      officialPdfFileName: '30-18_0.pdf',
      officialPdfUrl:
        'https://www.trec.texas.gov/sites/default/files/pdf-forms/30-18_0.pdf',
    },

    new_home_completed: {
      stateCode: 'TX',
      contractType:
        'new_home_completed',
      formId: '24-20',
      formName:
        'New Home Contract (Completed Construction)',
      effectiveDate: '2026-07-01',
      revisionDate: '2026-05-04',
      pageCount: 11,
      officialPdfFileName: '24-20_0.pdf',
      officialPdfUrl:
        'https://www.trec.texas.gov/sites/default/files/pdf-forms/24-20_0.pdf',
    },

    new_home_incomplete: {
      stateCode: 'TX',
      contractType:
        'new_home_incomplete',
      formId: '23-20',
      formName:
        'New Home Contract (Incomplete Construction)',
      effectiveDate: '2026-07-01',
      revisionDate: '2026-05-04',
      pageCount: 11,
      officialPdfFileName: '23-20_3.pdf',
      officialPdfUrl:
        'https://www.trec.texas.gov/sites/default/files/pdf-forms/23-20_3.pdf',
    },

    farm_and_ranch: {
      stateCode: 'TX',
      contractType:
        'farm_and_ranch',
      formId: '25-17',
      formName:
        'Farm and Ranch Contract',
      effectiveDate: '2026-07-01',
      revisionDate: '2026-05-04',
      pageCount: 12,
      officialPdfFileName: '25-17_4.pdf',
      officialPdfUrl:
        'https://www.trec.texas.gov/sites/default/files/pdf-forms/25-17_4.pdf',
    },

    unimproved_property: {
      stateCode: 'TX',
      contractType:
        'unimproved_property',
      formId: '9-18',
      formName:
        'Unimproved Property Contract',
      effectiveDate: '2026-07-01',
      revisionDate: '2026-05-04',
      pageCount: 11,
      officialPdfFileName: '9-18_1.pdf',
      officialPdfUrl:
        'https://www.trec.texas.gov/sites/default/files/pdf-forms/9-18_1.pdf',
    },
  };


export function getTexasContractDefinition(
  contractType: TexasContractType
): TexasContractDefinition {
  return TEXAS_CONTRACT_CATALOG[
    contractType
  ];
}
