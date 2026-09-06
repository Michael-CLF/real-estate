import {
  Injectable
} from '@angular/core';

import {
  FunctionsError,
  HttpsCallableResult,
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../infrastructure/firebase/firebase';

import {
  AssistantConversationMessage
} from '../models/assistant-message.model';

import {
  NavStreetAssistantResponse
} from '../models/assistant-response.model';

interface AskNavStreetAssistantRequest {
  message: string;
  conversationUid?: string;
  conversationHistory:
    AssistantConversationMessage[];
  currentPath?: string;
  anonymousSessionUid?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NavStreetAssistantService {

  private readonly askAssistantFunction =
    httpsCallable<
      AskNavStreetAssistantRequest,
      NavStreetAssistantResponse
    >(
      functions,
      'askNavStreetAssistant'
    );

  async askQuestion(
    message: string,
    conversationUid: string | null,
    conversationHistory:
      AssistantConversationMessage[],
    currentPath: string | null,
    anonymousSessionUid: string | null
  ): Promise<NavStreetAssistantResponse> {
    const normalizedMessage =
      message
        .replace(
          /\s+/g,
          ' '
        )
        .trim();

    if (!normalizedMessage) {
      throw new Error(
        'Enter a question for the NavStreet assistant.'
      );
    }

    try {
      const request:
        AskNavStreetAssistantRequest = {
          message:
            normalizedMessage,
          conversationHistory:
            conversationHistory.slice(
              -10
            ),
          ...(
            conversationUid
              ? {
                  conversationUid
                }
              : {}
          ),
          ...(
            currentPath
              ? {
                  currentPath
                }
              : {}
          ),
          ...(
            anonymousSessionUid
              ? {
                  anonymousSessionUid
                }
              : {}
          )
        };

      const result:
        HttpsCallableResult<
          NavStreetAssistantResponse
        > =
        await this
          .askAssistantFunction(
            request
          );

      return result.data;
    } catch (error: unknown) {
      console.error(
        'Unable to contact the NavStreet assistant:',
        error
      );

      throw new Error(
        this.getErrorMessage(
          error
        )
      );
    }
  }

  private getErrorMessage(
    error: unknown
  ): string {
    if (
      error instanceof
      FunctionsError
    ) {
      return this.cleanFirebaseMessage(
        error.message
      );
    }

    if (
      error instanceof Error &&
      error.message
    ) {
      return this.cleanFirebaseMessage(
        error.message
      );
    }

    return 'The NavStreet assistant is temporarily unavailable. Please try again.';
  }

  private cleanFirebaseMessage(
    message: string
  ): string {
    return message
      .replace(
        /^Firebase:\s*/i,
        ''
      )
      .replace(
        /\s*\(functions\/[^)]+\)\.?$/i,
        ''
      )
      .trim();
  }
}