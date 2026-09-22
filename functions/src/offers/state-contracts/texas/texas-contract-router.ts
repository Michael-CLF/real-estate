import {
  getTexasContractDefinition,
} from './texas-contract-catalog';

import type {
  TexasContractDefinition,
} from './texas-contract-catalog';


export interface TexasContractSelectionAnswers {
  readonly stateCode: string;

  readonly isImprovedProperty:
    boolean | null;

  readonly isCondominium:
    boolean | null;

  readonly isFarmOrRanch:
    boolean | null;

  readonly isBuilderSale:
    boolean | null;

  readonly constructionComplete:
    boolean | null;

  readonly dwellingUnitCount:
    number | null;
}


export type TexasContractSelectionField =
  keyof TexasContractSelectionAnswers;


export type TexasContractSelectionResult =
  | {
      readonly status: 'selected';
      readonly definition:
        TexasContractDefinition;
    }
  | {
      readonly status: 'incomplete';
      readonly missingFields:
        readonly TexasContractSelectionField[];
      readonly message: string;
    }
  | {
      readonly status: 'unsupported';
      readonly message: string;
    };


export function selectTexasContract(
  answers: TexasContractSelectionAnswers
): TexasContractSelectionResult {
  if (
    answers.stateCode
      .trim()
      .toUpperCase() !== 'TX'
  ) {
    return unsupported(
      'The Texas contract router can only process Texas property.'
    );
  }

  if (answers.isImprovedProperty === null) {
    return incomplete([
      'isImprovedProperty',
    ]);
  }

  if (!answers.isImprovedProperty) {
    return selected(
      'unimproved_property'
    );
  }

  const missingFields:
    TexasContractSelectionField[] = [];

  if (answers.isCondominium === null) {
    missingFields.push(
      'isCondominium'
    );
  }

  if (answers.isFarmOrRanch === null) {
    missingFields.push(
      'isFarmOrRanch'
    );
  }

  if (answers.isBuilderSale === null) {
    missingFields.push(
      'isBuilderSale'
    );
  }

  if (missingFields.length > 0) {
    return incomplete(
      missingFields
    );
  }

  const selectedSpecialClassifications = [
    answers.isCondominium,
    answers.isFarmOrRanch,
    answers.isBuilderSale,
  ].filter(
    value => value === true
  ).length;

  if (selectedSpecialClassifications > 1) {
    return unsupported(
      'The property classifications conflict. Select only one of condominium, farm or ranch, or builder sale.'
    );
  }

  if (answers.isCondominium) {
    return selected(
      'condominium_resale'
    );
  }

  if (answers.isFarmOrRanch) {
    return selected(
      'farm_and_ranch'
    );
  }

  if (answers.isBuilderSale) {
    if (answers.constructionComplete === null) {
      return incomplete([
        'constructionComplete',
      ]);
    }

    return selected(
      answers.constructionComplete
        ? 'new_home_completed'
        : 'new_home_incomplete'
    );
  }

  if (answers.dwellingUnitCount === null) {
    return incomplete([
      'dwellingUnitCount',
    ]);
  }

  if (
    !Number.isInteger(
      answers.dwellingUnitCount
    ) ||
    answers.dwellingUnitCount < 1 ||
    answers.dwellingUnitCount > 4
  ) {
    return unsupported(
      'The One to Four Family Residential Contract requires between one and four dwelling units.'
    );
  }

  return selected(
    'one_to_four_family_resale'
  );
}


function selected(
  contractType:
    TexasContractDefinition['contractType']
): TexasContractSelectionResult {
  return {
    status: 'selected',
    definition:
      getTexasContractDefinition(
        contractType
      ),
  };
}


function incomplete(
  missingFields:
    readonly TexasContractSelectionField[]
): TexasContractSelectionResult {
  return {
    status: 'incomplete',
    missingFields,
    message:
      'Additional property information is required before selecting the Texas contract.',
  };
}


function unsupported(
  message: string
): TexasContractSelectionResult {
  return {
    status: 'unsupported',
    message,
  };
}
