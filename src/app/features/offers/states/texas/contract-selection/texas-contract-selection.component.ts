import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import type {
  TexasContractDefinition,
  TexasContractSelectionAnswers,
} from '../../../../../core/domains/offers/state-contracts/texas/models/texas-contract-type.model';

import {
  selectTexasContract,
} from '../../../../../core/domains/offers/state-contracts/texas/services/texas-contract-router';


type TexasPropertyCategory =
  | 'standard_residential'
  | 'condominium'
  | 'farm_and_ranch'
  | 'builder_sale';


export interface TexasContractSelection {
  readonly answers:
    TexasContractSelectionAnswers;

  readonly definition:
    TexasContractDefinition;
}


@Component({
  selector:
    'app-texas-contract-selection',

  standalone: true,

  templateUrl:
    './texas-contract-selection.component.html',

  styleUrl:
    './texas-contract-selection.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class TexasContractSelectionComponent {
  readonly disabled = input(false);

  readonly contractSelected =
    output<TexasContractSelection>();

  protected readonly improvedProperty =
    signal<boolean | null>(null);

  protected readonly propertyCategory =
    signal<TexasPropertyCategory | null>(
      null
    );

  protected readonly constructionComplete =
    signal<boolean | null>(null);

  protected readonly dwellingUnitCount =
    signal<number | null>(null);

  protected readonly errorMessage =
    signal('');

  protected readonly showCategory = computed(
    () => this.improvedProperty() === true
  );

  protected readonly showConstructionStatus =
    computed(
      () =>
        this.propertyCategory() ===
          'builder_sale'
    );

  protected readonly showDwellingUnits =
    computed(
      () =>
        this.propertyCategory() ===
          'standard_residential'
    );

  protected readonly canContinue = computed(
    () =>
      selectTexasContract(
        this.createAnswers()
      ).status === 'selected'
  );


  protected selectImprovedProperty(
    value: boolean
  ): void {
    this.improvedProperty.set(value);
    this.errorMessage.set('');

    if (!value) {
      this.propertyCategory.set(null);
      this.constructionComplete.set(null);
      this.dwellingUnitCount.set(null);
    }
  }


  protected selectCategory(
    value: TexasPropertyCategory
  ): void {
    this.propertyCategory.set(value);
    this.errorMessage.set('');

    if (value !== 'builder_sale') {
      this.constructionComplete.set(null);
    }

    if (value !== 'standard_residential') {
      this.dwellingUnitCount.set(null);
    }
  }


  protected selectConstructionStatus(
    value: boolean
  ): void {
    this.constructionComplete.set(value);
    this.errorMessage.set('');
  }


  protected updateDwellingUnitCount(
    event: Event
  ): void {
    const value =
      (event.target as HTMLInputElement)
        .value;

    this.dwellingUnitCount.set(
      value.trim().length === 0
        ? null
        : Number(value)
    );

    this.errorMessage.set('');
  }


  protected continue(): void {
    if (this.disabled()) {
      return;
    }

    const answers = this.createAnswers();
    const result =
      selectTexasContract(answers);

    if (result.status !== 'selected') {
      this.errorMessage.set(
        result.message
      );

      return;
    }

    this.errorMessage.set('');

    this.contractSelected.emit({
      answers,
      definition: result.definition,
    });
  }


  private createAnswers():
    TexasContractSelectionAnswers {
    const category =
      this.propertyCategory();

    return {
      stateCode: 'TX',

      isImprovedProperty:
        this.improvedProperty(),

      isCondominium:
        this.improvedProperty() === true
          ? category === 'condominium'
          : null,

      isFarmOrRanch:
        this.improvedProperty() === true
          ? category === 'farm_and_ranch'
          : null,

      isBuilderSale:
        this.improvedProperty() === true
          ? category === 'builder_sale'
          : null,

      constructionComplete:
        category === 'builder_sale'
          ? this.constructionComplete()
          : null,

      dwellingUnitCount:
        category === 'standard_residential'
          ? this.dwellingUnitCount()
          : null,
    };
  }
}
