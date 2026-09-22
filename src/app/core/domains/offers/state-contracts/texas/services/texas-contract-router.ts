import {
  TEXAS_CONTRACT_DEFINITIONS,
} from '../models/texas-contract-type.model';

import type {
  TexasContractSelectionAnswers,
  TexasContractSelectionField,
  TexasContractSelectionResult,
  TexasContractType,
} from '../models/texas-contract-type.model';


export function selectTexasContract(
  answers: TexasContractSelectionAnswers
): TexasContractSelectionResult {
  if (
    answers.stateCode
      .trim()
      .toUpperCase() !== 'TX'
  ) {
    return {
      status: 'unsupported',
      message:
        'The Texas contract router can only process Texas property.',
    };
  }

  if (answers.isImprovedProperty === null) {
    return incompleteSelection([
      'isImprovedProperty',
    ]);
  }

  if (!answers.isImprovedProperty) {
    return selectedContract(
      'unimproved_property'
    );
  }

  const missingClassificationFields:
    TexasContractSelectionField[] = [];

  if (answers.isCondominium === null) {
    missingClassificationFields.push(
      'isCondominium'
    );
  }

  if (answers.isFarmOrRanch === null) {
    missingClassificationFields.push(
      'isFarmOrRanch'
    );
  }

  if (answers.isBuilderSale === null) {
    missingClassificationFields.push(
      'isBuilderSale'
    );
  }

  if (missingClassificationFields.length > 0) {
    return incompleteSelection(
      missingClassificationFields
    );
  }

  const selectedClassifications = [
    answers.isCondominium,
    answers.isFarmOrRanch,
    answers.isBuilderSale,
  ].filter(
    value => value === true
  ).length;

  if (selectedClassifications > 1) {
    return {
      status: 'unsupported',
      message:
        'The property classifications conflict. Select only one of condominium, farm or ranch, or builder sale.',
    };
  }

  if (answers.isCondominium) {
    return selectedContract(
      'condominium_resale'
    );
  }

  if (answers.isFarmOrRanch) {
    return selectedContract(
      'farm_and_ranch'
    );
  }

  if (answers.isBuilderSale) {
    if (answers.constructionComplete === null) {
      return incompleteSelection([
        'constructionComplete',
      ]);
    }

    return selectedContract(
      answers.constructionComplete
        ? 'new_home_completed'
        : 'new_home_incomplete'
    );
  }

  if (answers.dwellingUnitCount === null) {
    return incompleteSelection([
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
    return {
      status: 'unsupported',
      message:
        'The One to Four Family Residential Contract requires between one and four dwelling units.',
    };
  }

  return selectedContract(
    'one_to_four_family_resale'
  );
}

function selectedContract(
  contractType: TexasContractType
): TexasContractSelectionResult {
  return {
    status: 'selected',
    definition:
      TEXAS_CONTRACT_DEFINITIONS[
        contractType
      ],
  };
}

function incompleteSelection(
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
