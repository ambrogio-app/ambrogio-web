import type { Dictionary } from './dictionary';

export const it: Dictionary = {
  newChat: 'Nuova chat',
  refresh: 'Aggiorna',
  moreConversations: 'Altre conversazioni',
  conversations: 'Conversazioni',
  send: 'Invia',
  composerPlaceholder: 'Scrivi un messaggio',
  you: 'Tu',
  ambrogio: 'Ambrogio',
  pending: 'In elaborazione. Aggiorna più tardi per vedere l\'esito.',
  interrupted: 'Risposta interrotta.',
  emptyMessage: 'Scrivi un messaggio non vuoto.',
  messageTooLarge: 'Messaggio troppo grande (massimo 64 KiB).',
  backendUnreachable: 'Impossibile collegarsi al backend.',
  protocolError: 'Errore del protocollo.',
  conversationNotFound: 'Conversazione non trovata.',
  httpError: status => `Il backend ha risposto con un errore (HTTP ${status}).`,
  invalidConfiguration: 'Configurazione del client web non valida',
};
