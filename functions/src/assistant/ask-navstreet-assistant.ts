import {
  createHash,
  randomUUID
} from 'node:crypto';

import OpenAI from 'openai';

import {
  FieldValue,
  Timestamp
} from 'firebase-admin/firestore';

import {
  defineSecret
} from 'firebase-functions/params';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import * as logger from 'firebase-functions/logger';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  callableFunctionOptions
} from '../shared/function-options';

import {
  createAssistantKnowledgeContext,
  NAVSTREET_ASSISTANT_INSTRUCTIONS
} from './assistant-instructions';

import {
  getRelevantAssistantKnowledge
} from './assistant-knowledge';

import {
  createAssistantRateLimitIdentity,
  enforceAssistantRateLimit
} from './assistant-rate-limit';

import {
  AskNavStreetAssistantData,
  AskNavStreetAssistantResponse,
  AssistantKnowledgeItem
} from './assistant-types';

import {
  validateAssistantRequest
} from './assistant-validation';

const openAiApiKey =
  defineSecret('OPENAI_API_KEY');

const OPENAI_MODEL =
  'gpt-5-mini';

const MAXIMUM_OUTPUT_TOKENS =
  1200;

const MAXIMUM_ANSWER_LENGTH =
  3000;

interface ParsedAssistantOutput {
  answer: string;
  sourceIds: string[];
  requiresProfessionalAssistance: boolean;
}

interface PreparedConversation {
  conversationUid: string;
  conversationExists: boolean;
  conversationReference:
  FirebaseFirestore.DocumentReference;
  anonymousSessionHash: string | null;
}

export const askNavStreetAssistant =
  onCall<AskNavStreetAssistantData>(
    {
      ...callableFunctionOptions,
      secrets: [
        openAiApiKey
      ]
    },

    async request => {
      const preparedRequest =
        validateAssistantRequest(
          request.data
        );

      const authenticatedUserUid =
        request.auth?.uid;

      const rateLimitIdentity =
        createAssistantRateLimitIdentity(
          authenticatedUserUid,
          preparedRequest
            .anonymousSessionUid,
          request.rawRequest.ip
        );

      const rateLimitResult =
        await enforceAssistantRateLimit(
          rateLimitIdentity
        );

      const preparedConversation =
        await prepareConversation(
          preparedRequest
            .conversationUid,
          authenticatedUserUid,
          preparedRequest
            .anonymousSessionUid
        );

      const relevantKnowledge =
        getRelevantAssistantKnowledge(
          preparedRequest.message,
          preparedRequest.currentPath
        );

      const assistantKnowledgeContext =
        createAssistantKnowledgeContext(
          relevantKnowledge
        );

      const openAiClient =
        new OpenAI({
          apiKey:
            openAiApiKey.value()
        });

      try {
        const response =
          await openAiClient
            .responses
            .create({
              model:
                OPENAI_MODEL,

              reasoning: {
                effort:
                  'low'
              },

              instructions:
                NAVSTREET_ASSISTANT_INSTRUCTIONS,

              input: [
                {
                  role:
                    'developer',
                  content: [
                    'Use the following approved NavStreet knowledge for this request.',
                    '',
                    assistantKnowledgeContext,
                    '',
                    preparedRequest.currentPath
                      ? `The user is currently viewing this NavStreet path: ${preparedRequest.currentPath}`
                      : 'The user’s current NavStreet path was not provided.'
                  ].join('\n')
                },

                ...preparedRequest
                  .conversationHistory
                  .map(
                    message => ({
                      role:
                        message.role,
                      content:
                        message.content
                    })
                  ),

                {
                  role:
                    'user',
                  content:
                    preparedRequest.message
                }
              ],

              text: {
                format: {
                  type:
                    'json_schema',
                  name:
                    'navstreet_assistant_response',
                  strict:
                    true,
                  schema: {
                    type:
                      'object',
                    properties: {
                      answer: {
                        type:
                          'string',
                        minLength:
                          1,
                        maxLength:
                          MAXIMUM_ANSWER_LENGTH
                      },
                      sourceIds: {
                        type:
                          'array',
                        items: {
                          type:
                            'string'
                        },
                        maxItems:
                          6
                      },
                      requiresProfessionalAssistance: {
                        type:
                          'boolean'
                      }
                    },
                    required: [
                      'answer',
                      'sourceIds',
                      'requiresProfessionalAssistance'
                    ],
                    additionalProperties:
                      false
                  }
                }
              },

              max_output_tokens:
                MAXIMUM_OUTPUT_TOKENS
            });

        if (!response.output_text.trim()) {
          logger.error(
            'OpenAI returned no text for the NavStreet assistant.',
            {
              responseStatus:
                response.status,
              incompleteDetails:
                response.incomplete_details ??
                null,
              outputTypes:
                response.output.map(
                  outputItem =>
                    outputItem.type
                ),
              model:
                OPENAI_MODEL
            }
          );
        }

        const parsedOutput =
          parseAssistantOutput(
            response.output_text,
            relevantKnowledge
          );

        const messageUid =
          randomUUID();

        await saveConversationMessages(
          preparedConversation,
          authenticatedUserUid,
          preparedRequest.message,
          parsedOutput,
          messageUid,
          preparedRequest.currentPath,
          response.usage
        );

        return createCallableResponse(
          preparedConversation
            .conversationUid,
          messageUid,
          parsedOutput,
          relevantKnowledge,
          rateLimitResult
            .remainingRequests
        );
      } catch (error: unknown) {
        if (
          error instanceof HttpsError
        ) {
          throw error;
        }

        logger.error(
          'Unable to generate a NavStreet assistant response.',
          {
            error,
            conversationUid:
              preparedConversation
                .conversationUid,
            authenticated:
              Boolean(
                authenticatedUserUid
              )
          }
        );

        throw new HttpsError(
          'internal',
          'The NavStreet assistant is temporarily unavailable. Please try again.'
        );
      }
    }
  );

async function prepareConversation(
  requestedConversationUid:
    string | null,
  authenticatedUserUid:
    string | undefined,
  anonymousSessionUid:
    string | null
): Promise<PreparedConversation> {
  const anonymousSessionHash =
    anonymousSessionUid
      ? createHash('sha256')
        .update(
          anonymousSessionUid
        )
        .digest('hex')
      : null;

  const conversationUid =
    requestedConversationUid ??
    randomUUID();

  const conversationReference =
    adminFirestore
      .collection(
        'assistantConversations'
      )
      .doc(conversationUid);

  const conversationSnapshot =
    await conversationReference.get();

  if (!conversationSnapshot.exists) {
    if (requestedConversationUid) {
      throw new HttpsError(
        'not-found',
        'The assistant conversation could not be found.'
      );
    }

    return {
      conversationUid,
      conversationExists:
        false,
      conversationReference,
      anonymousSessionHash
    };
  }

  const conversationData =
    conversationSnapshot.data();

  const ownerUserUid =
    conversationData?.['userUid'];

  const ownerAnonymousSessionHash =
    conversationData
    ?.['anonymousSessionHash'];

  if (authenticatedUserUid) {
    if (
      ownerUserUid !==
      authenticatedUserUid
    ) {
      throw new HttpsError(
        'permission-denied',
        'You do not have permission to access this assistant conversation.'
      );
    }
  } else if (
    !anonymousSessionHash ||
    ownerAnonymousSessionHash !==
    anonymousSessionHash
  ) {
    throw new HttpsError(
      'permission-denied',
      'You do not have permission to access this assistant conversation.'
    );
  }

  return {
    conversationUid,
    conversationExists:
      true,
    conversationReference,
    anonymousSessionHash
  };
}

function parseAssistantOutput(
  outputText: string,
  relevantKnowledge:
    readonly AssistantKnowledgeItem[]
): ParsedAssistantOutput {
  if (!outputText.trim()) {
    throw new HttpsError(
      'internal',
      'The NavStreet assistant returned an empty response.'
    );
  }

  let parsedValue: unknown;

  try {
    parsedValue =
      JSON.parse(
        outputText
      );
  } catch (error: unknown) {
    logger.error(
      'Unable to parse the NavStreet assistant response.',
      {
        error
      }
    );

    throw new HttpsError(
      'internal',
      'The NavStreet assistant returned an invalid response.'
    );
  }

  if (
    !parsedValue ||
    typeof parsedValue !==
    'object' ||
    Array.isArray(parsedValue)
  ) {
    throw new HttpsError(
      'internal',
      'The NavStreet assistant returned an invalid response.'
    );
  }

  const output =
    parsedValue as
    Record<string, unknown>;

  const answer =
    output['answer'];

  const sourceIds =
    output['sourceIds'];

  const requiresProfessionalAssistance =
    output[
    'requiresProfessionalAssistance'
    ];

  if (
    typeof answer !==
    'string' ||
    !answer.trim() ||
    answer.length >
    MAXIMUM_ANSWER_LENGTH
  ) {
    throw new HttpsError(
      'internal',
      'The NavStreet assistant returned an invalid answer.'
    );
  }

  if (
    !Array.isArray(sourceIds) ||
    !sourceIds.every(
      sourceId =>
        typeof sourceId ===
        'string'
    )
  ) {
    throw new HttpsError(
      'internal',
      'The NavStreet assistant returned invalid sources.'
    );
  }

  if (
    typeof requiresProfessionalAssistance !==
    'boolean'
  ) {
    throw new HttpsError(
      'internal',
      'The NavStreet assistant returned an invalid professional-assistance status.'
    );
  }

  const allowedSourceIds =
    new Set(
      relevantKnowledge.map(
        knowledgeItem =>
          knowledgeItem.id
      )
    );

  const validatedSourceIds =
    Array.from(
      new Set(
        sourceIds.filter(
          sourceId =>
            allowedSourceIds.has(
              sourceId
            )
        )
      )
    );

  return {
    answer:
      answer.trim(),
    sourceIds:
      validatedSourceIds,
    requiresProfessionalAssistance
  };
}

async function saveConversationMessages(
  preparedConversation:
    PreparedConversation,
  authenticatedUserUid:
    string | undefined,
  userMessage: string,
  assistantOutput:
    ParsedAssistantOutput,
  assistantMessageUid: string,
  currentPath: string | null,
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  } | undefined
): Promise<void> {
  const timestamp =
    Timestamp.now();

  const userMessageUid =
    randomUUID();

  const userMessageReference =
    preparedConversation
      .conversationReference
      .collection('messages')
      .doc(userMessageUid);

  const assistantMessageReference =
    preparedConversation
      .conversationReference
      .collection('messages')
      .doc(assistantMessageUid);

  const batch =
    adminFirestore.batch();

  batch.set(
    preparedConversation
      .conversationReference,
    {
      conversationUid:
        preparedConversation
          .conversationUid,
      userUid:
        authenticatedUserUid ??
        null,
      anonymousSessionHash:
        authenticatedUserUid
          ? null
          : preparedConversation
            .anonymousSessionHash,
      status:
        'active',
      currentPath,
      messageCount:
        FieldValue.increment(2),
      inputTokenCount:
        FieldValue.increment(
          usage?.input_tokens ??
          0
        ),
      outputTokenCount:
        FieldValue.increment(
          usage?.output_tokens ??
          0
        ),
      totalTokenCount:
        FieldValue.increment(
          usage?.total_tokens ??
          0
        ),
      ...(
        preparedConversation
          .conversationExists
          ? {}
          : {
            createdAt:
              timestamp
          }
      ),
      updatedAt:
        timestamp
    },
    {
      merge:
        true
    }
  );

  batch.create(
    userMessageReference,
    {
      messageUid:
        userMessageUid,
      role:
        'user',
      content:
        userMessage,
      currentPath,
      createdAt:
        timestamp
    }
  );

  batch.create(
    assistantMessageReference,
    {
      messageUid:
        assistantMessageUid,
      role:
        'assistant',
      content:
        assistantOutput.answer,
      sourceIds:
        assistantOutput.sourceIds,
      requiresProfessionalAssistance:
        assistantOutput
          .requiresProfessionalAssistance,
      model:
        OPENAI_MODEL,
      inputTokenCount:
        usage?.input_tokens ??
        0,
      outputTokenCount:
        usage?.output_tokens ??
        0,
      totalTokenCount:
        usage?.total_tokens ??
        0,
      createdAt:
        timestamp
    }
  );

  await batch.commit();
}

function createCallableResponse(
  conversationUid: string,
  messageUid: string,
  assistantOutput:
    ParsedAssistantOutput,
  relevantKnowledge:
    readonly AssistantKnowledgeItem[],
  remainingRequests: number
): AskNavStreetAssistantResponse {
  const sourceIds =
    new Set(
      assistantOutput
        .sourceIds
    );

  return {
    conversationUid,
    messageUid,
    answer:
      assistantOutput.answer,
    sources:
      relevantKnowledge
        .filter(
          knowledgeItem =>
            sourceIds.has(
              knowledgeItem.id
            ) &&
            Boolean(
              knowledgeItem.path
            )
        )
        .map(
          knowledgeItem => ({
            id:
              knowledgeItem.id,
            title:
              knowledgeItem.title,
            path:
              knowledgeItem.path
          })
        ),
    remainingRequests,
    requiresProfessionalAssistance:
      assistantOutput
        .requiresProfessionalAssistance
  };
}