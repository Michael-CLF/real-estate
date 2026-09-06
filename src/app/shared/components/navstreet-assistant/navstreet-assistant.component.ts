import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal
} from '@angular/core';

import {
  isPlatformBrowser
} from '@angular/common';

import {
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AnalyticsDataLayerService,
} from '../../../core/analytics/analytics-data-layer.service';

import type {
  AnalyticsParameters
} from '../../../core/analytics/analytics-data-layer.service';

import {
  ASSISTANT_SUGGESTIONS
} from '../../../core/ai/config/assistant-suggestions';

import {
  AssistantMessage
} from '../../../core/ai/models/assistant-message.model';

import {
  NavStreetAssistantService
} from '../../../core/ai/services/navstreet-assistant.service';

const ASSISTANT_SESSION_STORAGE_KEY =
  'navstreet_assistant_session_uid';

const MAXIMUM_MESSAGE_LENGTH =
  1000;

type AssistantQuestionSource =
  | 'typed'
  | 'suggestion';

type AssistantFeedback =
  | 'helpful'
  | 'unhelpful';

@Component({
  selector:
    'app-navstreet-assistant',
  standalone:
    true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl:
    './navstreet-assistant.component.html',
  styleUrl:
    './navstreet-assistant.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class NavStreetAssistantComponent {

  @ViewChild('messageList')
  private messageList?:
    ElementRef<HTMLDivElement>;

  private readonly assistantService =
    inject(
      NavStreetAssistantService
    );

  private readonly analytics =
    inject(
      AnalyticsDataLayerService
    );

  private readonly router =
    inject(Router);

  private readonly platformId =
    inject(PLATFORM_ID);

  readonly suggestions =
    ASSISTANT_SUGGESTIONS;

  readonly messageControl =
    new FormControl(
      '',
      {
        nonNullable:
          true,
        validators: [
          Validators.required,
          Validators.maxLength(
            MAXIMUM_MESSAGE_LENGTH
          )
        ]
      }
    );

  readonly isOpen =
    signal(false);

  readonly isSending =
    signal(false);

  readonly messages =
    signal<AssistantMessage[]>([]);

  readonly conversationUid =
    signal<string | null>(
      null
    );

  readonly remainingRequests =
    signal<number | null>(
      null
    );

  readonly errorMessage =
    signal<string | null>(
      null
    );

  readonly feedbackByMessageUid =
    signal<
      Record<
        string,
        AssistantFeedback
      >
    >({});

  readonly maximumMessageLength =
    MAXIMUM_MESSAGE_LENGTH;

  private readonly anonymousSessionUid =
    this.getOrCreateAnonymousSessionUid();

  openAssistant(): void {
    if (this.isOpen()) {
      return;
    }

    const existingMessages =
      this.messages();

    this.isOpen.set(true);
    this.errorMessage.set(null);

    this.trackAssistantEvent(
      'assistant_opened',
      {
        has_existing_messages:
          existingMessages.length > 0,
        message_count:
          existingMessages.length,
        question_count:
          this.getQuestionCount(
            existingMessages
          )
      }
    );

    this.scheduleScrollToBottom();
  }

  closeAssistant(): void {
    this.isOpen.set(false);
  }

  toggleAssistant(): void {
    if (this.isOpen()) {
      this.closeAssistant();
      return;
    }

    this.openAssistant();
  }

  handleQuestionKeydown(
    event: KeyboardEvent
  ): void {
    if (
      event.key !== 'Enter' ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    void this.submitQuestion();
  }

  async submitQuestion():
    Promise<void> {
    if (
      this.isSending() ||
      this.messageControl.invalid
    ) {
      this.messageControl
        .markAsTouched();

      return;
    }

    const question =
      this.messageControl
        .getRawValue()
        .replace(
          /\s+/g,
          ' '
        )
        .trim();

    if (!question) {
      return;
    }

    await this.sendQuestion(
      question,
      'typed'
    );
  }

  async useSuggestion(
    question: string,
    suggestionPosition = 0
  ): Promise<void> {
    if (this.isSending()) {
      return;
    }

    this.trackAssistantEvent(
      'assistant_suggestion_selected',
      {
        suggestion_position:
          suggestionPosition + 1
      }
    );

    this.messageControl.setValue(
      question
    );

    await this.sendQuestion(
      question,
      'suggestion'
    );
  }

  startNewConversation(): void {
    if (this.isSending()) {
      return;
    }

    const existingMessages =
      this.messages();

    if (existingMessages.length) {
      this.trackAssistantEvent(
        'assistant_new_conversation',
        {
          previous_message_count:
            existingMessages.length,
          previous_question_count:
            this.getQuestionCount(
              existingMessages
            )
        }
      );
    }

    this.messages.set([]);
    this.conversationUid.set(null);
    this.remainingRequests.set(null);
    this.errorMessage.set(null);
    this.feedbackByMessageUid.set({});
    this.messageControl.reset();

    this.scheduleScrollToBottom();
  }

  trackSourceClick(
    sourceId: string,
    sourcePosition: number
  ): void {
    this.trackAssistantEvent(
      'assistant_source_clicked',
      {
        source_id:
          sourceId,
        source_position:
          sourcePosition + 1
      }
    );

    this.closeAssistant();
  }

  submitFeedback(
    message: AssistantMessage,
    feedback: AssistantFeedback
  ): void {
    const existingFeedback =
      this.feedbackByMessageUid()[
      message.uid
      ];

    if (existingFeedback) {
      return;
    }

    this.feedbackByMessageUid.update(
      feedbackByMessageUid => ({
        ...feedbackByMessageUid,
        [message.uid]:
          feedback
      })
    );

    this.trackAssistantEvent(
      'assistant_feedback_submitted',
      {
        feedback_value:
          feedback,
        has_sources:
          message.sources.length > 0,
        requires_professional_assistance:
          message
            .requiresProfessionalAssistance
      }
    );
  }

  trackMessage(
    index: number,
    message: AssistantMessage
  ): string {
    return message.uid;
  }

  private async sendQuestion(
    question: string,
    questionSource:
      AssistantQuestionSource
  ): Promise<void> {
    const previousMessages =
      this.messages();

    const questionNumber =
      this.getQuestionCount(
        previousMessages
      ) + 1;

    const conversationHistory =
      previousMessages
        .slice(-10)
        .map(
          message => ({
            role:
              message.role,
            content:
              message.content
          })
        );

    const userMessage:
      AssistantMessage = {
      uid:
        this.createUid(),
      role:
        'user',
      content:
        question,
      createdAt:
        new Date(),
      sources:
        [],
      requiresProfessionalAssistance:
        false
    };

    this.trackAssistantEvent(
      'assistant_question_submitted',
      {
        input_method:
          questionSource,
        question_number:
          questionNumber
      }
    );

    this.messages.update(
      messages => [
        ...messages,
        userMessage
      ]
    );

    this.messageControl.reset();
    this.messageControl.disable();
    this.isSending.set(true);
    this.errorMessage.set(null);

    this.scheduleScrollToBottom();

    const requestStartedAt =
      Date.now();

    try {
      const response =
        await this.assistantService
          .askQuestion(
            question,
            this.conversationUid(),
            conversationHistory,
            this.router.url,
            this.anonymousSessionUid
          );

      const assistantMessage:
        AssistantMessage = {
        uid:
          response.messageUid,
        role:
          'assistant',
        content:
          response.answer,
        createdAt:
          new Date(),
        sources:
          response.sources,
        requiresProfessionalAssistance:
          response
            .requiresProfessionalAssistance
      };

      this.conversationUid.set(
        response.conversationUid
      );

      this.remainingRequests.set(
        response.remainingRequests
      );

      this.messages.update(
        messages => [
          ...messages,
          assistantMessage
        ]
      );

      this.trackAssistantEvent(
        'assistant_response_received',
        {
          input_method:
            questionSource,
          question_number:
            questionNumber,
          response_time_ms:
            Date.now() -
            requestStartedAt,
          has_sources:
            response.sources.length > 0,
          source_count:
            response.sources.length,
          requires_professional_assistance:
            response
              .requiresProfessionalAssistance,
          remaining_requests:
            response.remainingRequests
        }
      );
    } catch (error: unknown) {
      this.trackAssistantEvent(
        'assistant_response_error',
        {
          input_method:
            questionSource,
          question_number:
            questionNumber,
          response_time_ms:
            Date.now() -
            requestStartedAt
        }
      );

      this.errorMessage.set(
        error instanceof Error &&
          error.message
          ? error.message
          : 'The NavStreet assistant is temporarily unavailable. Please try again.'
      );
    } finally {
      this.isSending.set(false);
      this.messageControl.enable();

      this.scheduleScrollToBottom();
    }
  }

  private trackAssistantEvent(
    eventName: string,
    parameters:
      AnalyticsParameters = {}
  ): void {
    /*
     * Data Layer variables persist between
     * events unless they are explicitly
     * cleared. Reset every assistant
     * parameter before adding the values
     * belonging to the current event.
     */
    this.analytics.track(
      eventName,
      {
        has_existing_messages:
          null,
        message_count:
          null,
        question_count:
          null,
        suggestion_position:
          null,
        input_method:
          null,
        question_number:
          null,
        response_time_ms:
          null,
        has_sources:
          null,
        source_count:
          null,
        requires_professional_assistance:
          null,
        remaining_requests:
          null,
        feedback_value:
          null,
        source_id:
          null,
        source_position:
          null,
        previous_message_count:
          null,
        previous_question_count:
          null,
        ...parameters
      }
    );
  }

  private getQuestionCount(
    messages:
      readonly AssistantMessage[] =
      this.messages()
  ): number {
    return messages.filter(
      message =>
        message.role === 'user'
    ).length;
  }

  private scheduleScrollToBottom():
    void {
    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return;
    }

    window.setTimeout(
      () => {
        const messageList =
          this.messageList
            ?.nativeElement;

        if (!messageList) {
          return;
        }

        messageList.scrollTop =
          messageList.scrollHeight;
      }
    );
  }

  private getOrCreateAnonymousSessionUid():
    string | null {
    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return null;
    }

    try {
      const existingUid =
        window.sessionStorage
          .getItem(
            ASSISTANT_SESSION_STORAGE_KEY
          );

      if (existingUid) {
        return existingUid;
      }

      const newUid =
        this.createUid();

      window.sessionStorage
        .setItem(
          ASSISTANT_SESSION_STORAGE_KEY,
          newUid
        );

      return newUid;
    } catch {
      return this.createUid();
    }
  }

  private createUid(): string {
    if (
      isPlatformBrowser(
        this.platformId
      ) &&
      typeof window.crypto
        ?.randomUUID ===
      'function'
    ) {
      return window.crypto
        .randomUUID();
    }

    return [
      Date.now().toString(36),
      Math.random()
        .toString(36)
        .slice(2)
    ].join('_');
  }
}