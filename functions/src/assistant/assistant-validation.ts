import {
  HttpsError
} from 'firebase-functions/v2/https';

import {
  AssistantConversationMessage,
  PreparedAssistantRequest
} from './assistant-types';

const MAXIMUM_MESSAGE_LENGTH =
  1000;

const MAXIMUM_CONVERSATION_MESSAGES =
  10;

const MAXIMUM_CONVERSATION_MESSAGE_LENGTH =
  2000;

const MAXIMUM_PATH_LENGTH =
  300;

const MAXIMUM_IDENTIFIER_LENGTH =
  128;

const IDENTIFIER_PATTERN =
  /^[A-Za-z0-9_-]+$/;

export function validateAssistantRequest(
  value: unknown
): PreparedAssistantRequest {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'A valid assistant request is required.'
    );
  }

  const data =
    value as Record<string, unknown>;

  return {
    message:
      validateMessage(
        data['message']
      ),
    conversationUid:
      validateOptionalIdentifier(
        data['conversationUid'],
        'conversation identifier'
      ),
    conversationHistory:
      validateConversationHistory(
        data['conversationHistory']
      ),
    currentPath:
      validateCurrentPath(
        data['currentPath']
      ),
    anonymousSessionUid:
      validateOptionalIdentifier(
        data['anonymousSessionUid'],
        'anonymous session identifier'
      )
  };
}

function validateMessage(
  value: unknown
): string {
  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'Enter a question for the NavStreet assistant.'
    );
  }

  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    throw new HttpsError(
      'invalid-argument',
      'Enter a question for the NavStreet assistant.'
    );
  }

  if (
    normalizedValue.length >
    MAXIMUM_MESSAGE_LENGTH
  ) {
    throw new HttpsError(
      'invalid-argument',
      `Questions cannot exceed ${MAXIMUM_MESSAGE_LENGTH} characters.`
    );
  }

  return normalizedValue;
}

function validateConversationHistory(
  value: unknown
): AssistantConversationMessage[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HttpsError(
      'invalid-argument',
      'The assistant conversation history is invalid.'
    );
  }

  if (
    value.length >
    MAXIMUM_CONVERSATION_MESSAGES
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The assistant conversation is too long. Start a new conversation.'
    );
  }

  return value.map(
    (
      message: unknown,
      index: number
    ) =>
      validateConversationMessage(
        message,
        index
      )
  );
}

function validateConversationMessage(
  value: unknown,
  index: number
): AssistantConversationMessage {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new HttpsError(
      'invalid-argument',
      `Conversation message ${index + 1} is invalid.`
    );
  }

  const message =
    value as Record<string, unknown>;

  const role =
    message['role'];

  if (
    role !== 'user' &&
    role !== 'assistant'
  ) {
    throw new HttpsError(
      'invalid-argument',
      `Conversation message ${index + 1} has an invalid role.`
    );
  }

  const content =
    message['content'];

  if (typeof content !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      `Conversation message ${index + 1} has invalid content.`
    );
  }

  const normalizedContent =
    normalizeText(content);

  if (!normalizedContent) {
    throw new HttpsError(
      'invalid-argument',
      `Conversation message ${index + 1} cannot be empty.`
    );
  }

  if (
    normalizedContent.length >
    MAXIMUM_CONVERSATION_MESSAGE_LENGTH
  ) {
    throw new HttpsError(
      'invalid-argument',
      `Conversation message ${index + 1} is too long.`
    );
  }

  return {
    role,
    content:
      normalizedContent
  };
}

function validateCurrentPath(
  value: unknown
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'The current page path is invalid.'
    );
  }

  const normalizedValue =
    value.trim();

  if (
    !normalizedValue.startsWith('/') ||
    normalizedValue.length >
      MAXIMUM_PATH_LENGTH
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The current page path is invalid.'
    );
  }

  return normalizedValue;
}

function validateOptionalIdentifier(
  value: unknown,
  label: string
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  if (
    typeof value !== 'string' ||
    value.length >
      MAXIMUM_IDENTIFIER_LENGTH ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw new HttpsError(
      'invalid-argument',
      `The ${label} is invalid.`
    );
  }

  return value;
}

function normalizeText(
  value: string
): string {
  return value
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}