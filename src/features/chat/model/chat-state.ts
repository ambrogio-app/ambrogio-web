export type ChatTurn = {
  readonly id: string;
  readonly text: string;
  readonly status: 'pending' | 'answered' | 'failed' | 'interrupted';
  readonly answer?: string;
  readonly error?: string;
};

/** The stored conversation as read from the backend history. */
export type ChatHistory = { readonly id: string; readonly turns: readonly ChatTurn[] };

/** How a turn sent from this page ended. */
export type TurnOutcome =
  | { readonly kind: 'completed'; readonly answer: string }
  | { readonly kind: 'failed'; readonly message: string }
  | { readonly kind: 'interrupted' }
  | { readonly kind: 'unreachable' }
  | { readonly kind: 'protocol' };

/** A turn sent from this page, shown until the stored history replaces it. */
export type LocalTurn = {
  readonly text: string;
  readonly answer: string;
  readonly outcome: TurnOutcome | null;
};

export type Chat = {
  readonly key: string;
  readonly conversationId: string | null;
  readonly title: string | null;
  readonly history: ChatHistory | null;
  readonly historyError: string | null;
  readonly local: LocalTurn | null;
};

export type Announcement = { readonly chatKey: string; readonly serial: number; readonly outcome: TurnOutcome };

export type ChatState = {
  readonly current: string;
  readonly chats: Readonly<Record<string, Chat>>;
  readonly nextDraft: number;
  readonly announcement: Announcement | null;
};

export type ChatAction =
  | { readonly type: 'new-chat' }
  | { readonly type: 'open-conversation'; readonly conversationId: string }
  | { readonly type: 'history-loaded'; readonly history: ChatHistory }
  | { readonly type: 'history-failed'; readonly conversationId: string; readonly message: string }
  | { readonly type: 'turn-started'; readonly key: string; readonly text: string }
  | { readonly type: 'turn-accepted'; readonly key: string; readonly conversationId: string }
  | { readonly type: 'turn-delta'; readonly key: string; readonly text: string }
  | { readonly type: 'turn-finished'; readonly key: string; readonly outcome: TurnOutcome };

function draft(index: number): Chat {
  return { key: `draft:${index}`, conversationId: null, title: null, history: null, historyError: null, local: null };
}

export const initialChatState: ChatState = { current: 'draft:0', chats: { 'draft:0': draft(0) }, nextDraft: 1,
  announcement: null };

export function currentChat(state: ChatState): Chat {
  return state.chats[state.current]!;
}

export function chatForConversation(state: ChatState, conversationId: string): Chat | undefined {
  return Object.values(state.chats).find(chat => chat.conversationId === conversationId);
}

/** Whether a turn of this chat is still waiting for its outcome. */
export function turnInProgress(chat: Chat): boolean {
  return chat.local !== null && chat.local.outcome === null;
}

/** Drops the chat being left when it is an unsent new chat. */
function leave(state: ChatState): Readonly<Record<string, Chat>> {
  const chat = currentChat(state);
  if (chat.conversationId !== null || chat.local !== null) return state.chats;
  const { [chat.key]: _left, ...rest } = state.chats;
  return rest;
}

function update(state: ChatState, key: string, change: (chat: Chat) => Chat): ChatState {
  const chat = state.chats[key];
  return chat ? { ...state, chats: { ...state.chats, [key]: change(chat) } } : state;
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'new-chat': {
      if (currentChat(state).conversationId === null && currentChat(state).local === null) return state;
      const chat = draft(state.nextDraft);
      return { ...state, current: chat.key, chats: { ...leave(state), [chat.key]: chat }, nextDraft: state.nextDraft + 1 };
    }
    case 'open-conversation': {
      const existing = chatForConversation(state, action.conversationId);
      if (existing?.key === state.current) return state;
      const chats = leave(state);
      if (existing) return { ...state, current: existing.key, chats };
      const chat: Chat = { key: action.conversationId, conversationId: action.conversationId, title: null,
        history: null, historyError: null, local: null };
      return { ...state, current: chat.key, chats: { ...chats, [chat.key]: chat } };
    }
    case 'history-loaded': {
      const chat = chatForConversation(state, action.history.id);
      if (!chat) return state;
      return update(state, chat.key, current => ({ ...current, history: action.history, historyError: null,
        title: current.title ?? action.history.turns[0]?.text ?? null,
        local: current.local !== null && current.local.outcome === null ? current.local : null }));
    }
    case 'history-failed': {
      const chat = chatForConversation(state, action.conversationId);
      if (!chat) return state;
      return update(state, chat.key, current => ({ ...current, historyError: action.message }));
    }
    case 'turn-started':
      return update(state, action.key, chat => ({ ...chat, title: chat.title ?? action.text,
        local: { text: action.text, answer: '', outcome: null } }));
    case 'turn-accepted':
      return update(state, action.key, chat => ({ ...chat, conversationId: action.conversationId }));
    case 'turn-delta':
      return update(state, action.key, chat => chat.local === null || chat.local.outcome !== null ? chat
        : { ...chat, local: { ...chat.local, answer: chat.local.answer + action.text } });
    case 'turn-finished': {
      const next = update(state, action.key, chat => chat.local === null ? chat
        : { ...chat, local: { ...chat.local, outcome: action.outcome } });
      const serial = (state.announcement?.serial ?? 0) + 1;
      return { ...next, announcement: { chatKey: action.key, serial, outcome: action.outcome } };
    }
  }
}
