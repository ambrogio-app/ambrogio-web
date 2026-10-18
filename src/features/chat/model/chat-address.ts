const conversationFragment = /^#\/c\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** The conversation named by a `#/c/<conversationId>` fragment; any other fragment names none. */
export function conversationFromFragment(fragment: string): string | null {
  return conversationFragment.exec(fragment)?.[1] ?? null;
}

/** The fragment of a conversation, or the empty fragment of a new chat. */
export function fragmentForConversation(conversationId: string | null): string {
  return conversationId === null ? '' : `#/c/${conversationId}`;
}
