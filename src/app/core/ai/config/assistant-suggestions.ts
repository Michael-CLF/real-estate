export interface AssistantSuggestion {
  label: string;
  question: string;
}

export const ASSISTANT_SUGGESTIONS:
  readonly AssistantSuggestion[] = [
    {
      label:
        'How NavStreet works',
      question:
        'What does NavStreet do and how does it work?'
    },
    {
      label:
        'Create a listing',
      question:
        'How do I create and publish a property listing?'
    },
    {
      label:
        'Manage showings',
      question:
        'How do showing availability and showing requests work?'
    },
    {
      label:
        'Listing enhancements',
      question:
        'What are listing enhancements and when should I complete them?'
    },
    {
      label:
        'Marketing Toolkit',
      question:
        'How does the Marketing Toolkit help me promote my listing?'
    },
    {
      label:
        'Contract timeline',
      question:
        'What is the Contract Timeline and how should I use it?'
    }
  ];