import type { ConversationSummary } from './conversations-api';

export const previewLength = 60;

/** `undefined` while the history is being read, `null` when it could not be read. */
export type Preview = string | null | undefined;

export type ListEntry = { readonly id: string; readonly preview: Preview };

export type ConversationListState = {
  readonly entries: readonly ListEntry[];
  readonly nextCursor: string | null;
  readonly loading: boolean;
  readonly error: string | null;
};

export type ConversationListAction =
  | { readonly type: 'refresh-started' }
  | { readonly type: 'more-started' }
  | { readonly type: 'page-loaded'; readonly items: readonly ConversationSummary[]; readonly nextCursor: string | null;
      readonly append: boolean }
  | { readonly type: 'page-failed'; readonly message: string }
  | { readonly type: 'preview-loaded'; readonly id: string; readonly preview: string | null }
  | { readonly type: 'conversation-created'; readonly id: string; readonly preview: string };

export const initialConversationList: ConversationListState = {
  entries: [], nextCursor: null, loading: false, error: null,
};

/** First person message shortened to the preview length, with «…» when cut. */
export function previewText(value: string): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > previewLength ? `${clean.slice(0, previewLength - 1)}…` : clean;
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export function entryLabel(entry: ListEntry): string {
  return entry.preview ?? shortId(entry.id);
}

export function conversationListReducer(state: ConversationListState,
  action: ConversationListAction): ConversationListState {
  switch (action.type) {
    case 'refresh-started':
      return { ...state, nextCursor: null, loading: true, error: null };
    case 'more-started':
      return { ...state, loading: true, error: null };
    case 'page-loaded': {
      const known = new Map(state.entries.map(entry => [entry.id, entry]));
      const loaded = action.items.map(item => known.get(item.id) ?? { id: item.id, preview: undefined });
      const entries = action.append
        ? [...state.entries, ...loaded.filter(entry => !state.entries.some(existing => existing.id === entry.id))]
        : loaded;
      return { entries, nextCursor: action.nextCursor, loading: false, error: null };
    }
    case 'page-failed':
      return { ...state, loading: false, error: action.message };
    case 'preview-loaded':
      return { ...state, entries: state.entries.map(entry => entry.id === action.id
        ? { ...entry, preview: action.preview === null ? null : previewText(action.preview) } : entry) };
    case 'conversation-created':
      if (state.entries.some(entry => entry.id === action.id)) return state;
      return { ...state, entries: [{ id: action.id, preview: previewText(action.preview) }, ...state.entries] };
  }
}
