import { describe, expect, it } from 'vitest';
import {
  conversationListReducer, entryLabel, initialConversationList, previewText, type ConversationListAction,
  type ConversationListState,
} from '../../../../src/features/conversations/model/conversation-list';

const item = (id: string) => ({ id, lastActivityAt: '2026-10-18T08:00:00.000Z' });

function run(actions: ConversationListAction[], state: ConversationListState = initialConversationList) {
  return actions.reduce(conversationListReducer, state);
}

describe('previewText', () => {
  it('keeps short texts and cuts long ones to 60 characters with an ellipsis', () => {
    expect(previewText('  Ciao\n Ambrogio  ')).toBe('Ciao Ambrogio');
    const long = previewText('a'.repeat(80));
    expect(long).toHaveLength(60);
    expect(long.endsWith('…')).toBe(true);
    expect(previewText('b'.repeat(60))).toBe('b'.repeat(60));
  });
});

describe('conversationListReducer', () => {
  it('appends the next page and forgets the cursor when refreshed', () => {
    const paged = run([
      { type: 'refresh-started' },
      { type: 'page-loaded', items: [item('c-1')], nextCursor: 'next', append: false },
      { type: 'more-started' },
      { type: 'page-loaded', items: [item('c-2')], nextCursor: null, append: true },
    ]);
    expect(paged.entries.map(entry => entry.id)).toEqual(['c-1', 'c-2']);
    const refreshed = run([{ type: 'page-loaded', items: [item('c-1')], nextCursor: 'next', append: false },
      { type: 'refresh-started' }], paged);
    expect(refreshed.nextCursor).toBeNull();
    expect(refreshed.loading).toBe(true);
  });

  it('labels entries with their preview or a short identifier', () => {
    const state = run([
      { type: 'page-loaded', items: [item('0123456789abcdef'), item('c-2')], nextCursor: null, append: false },
      { type: 'preview-loaded', id: '0123456789abcdef', preview: null },
      { type: 'preview-loaded', id: 'c-2', preview: 'Che tempo fa?' },
    ]);
    expect(state.entries.map(entryLabel)).toEqual(['01234567', 'Che tempo fa?']);
  });

  it('keeps known previews across a refresh and records errors', () => {
    const state = run([
      { type: 'page-loaded', items: [item('c-1')], nextCursor: null, append: false },
      { type: 'preview-loaded', id: 'c-1', preview: 'uno' },
      { type: 'page-loaded', items: [item('c-1')], nextCursor: null, append: false },
      { type: 'page-failed', message: 'Non riesco a completare la risposta.' },
    ]);
    expect(state.entries[0]!.preview).toBe('uno');
    expect(state.error).toBe('Non riesco a completare la risposta.');
  });

  it('puts a conversation created on this page first', () => {
    const state = run([
      { type: 'page-loaded', items: [item('c-1')], nextCursor: null, append: false },
      { type: 'conversation-created', id: 'c-new', preview: 'nuova' },
      { type: 'conversation-created', id: 'c-new', preview: 'nuova' },
    ]);
    expect(state.entries.map(entry => entry.id)).toEqual(['c-new', 'c-1']);
  });
});
