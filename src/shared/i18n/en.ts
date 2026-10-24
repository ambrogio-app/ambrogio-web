import type { Dictionary } from './dictionary';

export const en: Dictionary = {
  newChat: 'New chat',
  refresh: 'Refresh',
  moreConversations: 'More conversations',
  conversations: 'Conversations',
  send: 'Send',
  composerPlaceholder: 'Write a message',
  you: 'You',
  ambrogio: 'Ambrogio',
  pending: 'In progress. Refresh later to see the outcome.',
  interrupted: 'Response interrupted.',
  emptyMessage: 'Write a non-empty message.',
  messageTooLarge: 'Message too large (64 KiB at most).',
  backendUnreachable: 'Cannot connect to the backend.',
  protocolError: 'Protocol error.',
  conversationNotFound: 'Conversation not found.',
  httpError: status => `The backend answered with an error (HTTP ${status}).`,
  invalidConfiguration: 'Invalid web client configuration',
};
