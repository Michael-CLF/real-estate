import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  ListingTransaction,
  ListingTransactionTask,
  ListingTransactionTaskStatus
} from '../../../core/domains/transactions/models/listing-transaction.model';

import {
  ListingTransactionService
} from '../../../core/domains/transactions/services/listing-transaction.service';

@Component({
  selector: 'app-listing-transaction',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl:
    './listing-transaction.component.html',
  styleUrl:
    './listing-transaction.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingTransactionComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly transactionService =
    inject(ListingTransactionService);

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  protected readonly transaction =
    signal<ListingTransaction | null>(
      null
    );

  protected readonly tasks =
    signal<ListingTransactionTask[]>(
      []
    );

  protected readonly isLoading =
    signal(true);

  protected readonly isSaving =
    signal(false);

  protected readonly hasChanges =
    signal(false);

  protected readonly loadError =
    signal('');

  protected readonly saveError =
    signal('');

  protected readonly saveMessage =
    signal('');

  async ngOnInit(): Promise<void> {
    if (!this.listingUid) {
      this.loadError.set(
        'The selected listing could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    try {
      const transaction =
        await this.transactionService
          .getTransaction(
            this.listingUid
          );

      this.applyTransaction(
        transaction
      );

    } catch (error: unknown) {
      console.error(
        'Unable to load contract timeline:',
        error
      );

      this.loadError.set(
        error instanceof Error
          ? error.message
          : 'The contract timeline could not be loaded.'
      );

    } finally {
      this.isLoading.set(false);
    }
  }

  protected updateDueDate(
    taskId: ListingTransactionTask['id'],
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const dueDate =
      input.value || null;

    this.updateTask(
      taskId,
      task => ({
        ...task,
        dueDate
      })
    );
  }

  protected updateStatus(
    taskId: ListingTransactionTask['id'],
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    const status =
      select.value as
      ListingTransactionTaskStatus;

    this.updateTask(
      taskId,
      task => ({
        ...task,
        status
      })
    );
  }

  protected async saveTimeline():
    Promise<void> {

    const transaction =
      this.transaction();

    if (
      !transaction?.canEdit ||
      this.isSaving() ||
      !this.hasChanges()
    ) {
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');
    this.saveMessage.set('');

    try {
      const savedTransaction =
        await this.transactionService
          .saveTransaction(
            this.listingUid,

            this.tasks().map(
              task => ({
                id:
                  task.id,

                dueDate:
                  task.dueDate,

                status:
                  task.status
              })
            )
          );

      this.applyTransaction(
        savedTransaction
      );

      this.saveMessage.set(
        'Contract timeline saved.'
      );

    } catch (error: unknown) {
      console.error(
        'Unable to save contract timeline:',
        error
      );

      this.saveError.set(
        error instanceof Error
          ? error.message
          : 'The contract timeline could not be saved.'
      );

    } finally {
      this.isSaving.set(false);
    }
  }

  protected isOverdue(
    task: ListingTransactionTask
  ): boolean {

    if (
      !task.dueDate ||
      task.status !== 'pending'
    ) {
      return false;
    }

    const today =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    return task.dueDate < today;
  }

  private updateTask(
    taskId: ListingTransactionTask['id'],

    update: (
      task: ListingTransactionTask
    ) => ListingTransactionTask
  ): void {

    if (!this.transaction()?.canEdit) {
      return;
    }

    this.tasks.update(
      tasks =>
        tasks.map(
          task =>
            task.id === taskId
              ? update(task)
              : task
        )
    );

    this.hasChanges.set(true);
    this.saveError.set('');
    this.saveMessage.set('');
  }

  private applyTransaction(
    transaction: ListingTransaction
  ): void {

    this.transaction.set(
      transaction
    );

    this.tasks.set(
      transaction.tasks.map(
        task => ({
          ...task
        })
      )
    );

    this.hasChanges.set(false);
  }
}