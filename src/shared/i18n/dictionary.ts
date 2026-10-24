export const languages = ['it', 'en'] as const;

export type Language = (typeof languages)[number];

/** The fixed texts of the interface, one entry per key of the language contract. */
export type Dictionary = {
  readonly newChat: string;
  readonly refresh: string;
  readonly moreConversations: string;
  readonly conversations: string;
  readonly send: string;
  readonly composerPlaceholder: string;
  readonly you: string;
  readonly ambrogio: string;
  readonly pending: string;
  readonly interrupted: string;
  readonly emptyMessage: string;
  readonly messageTooLarge: string;
  readonly backendUnreachable: string;
  readonly protocolError: string;
  readonly conversationNotFound: string;
  readonly httpError: (status: number) => string;
  readonly invalidConfiguration: string;
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (languages as readonly string[]).includes(value);
}

/** The first supported language among the browser preferences, otherwise English. */
export function preferredLanguage(preferences: readonly string[]): Language {
  for (const preference of preferences) {
    const primary = preference.toLowerCase().split('-')[0];
    if (isLanguage(primary)) return primary;
  }
  return 'en';
}
