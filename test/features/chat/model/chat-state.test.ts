import { describe, expect, it } from 'vitest';
import {
  chatReducer, currentChat, initialChatState, turnInProgress, type ChatAction, type ChatState,
} from '../../../../src/features/chat/model/chat-state';

function run(actions: ChatAction[], state: ChatState = initialChatState): ChatState {
  return actions.reduce(chatReducer, state);
}

const history = (id: string, text = 'domanda') => ({ id, turns: [{ id: 't-1', text, status: 'answered' as const,
  answer: 'risposta' }] });

describe('chatReducer', () => {
  it('starts on a local new chat that takes the first text as title', () => {
    const state = run([{ type: 'turn-started', key: 'draft:0', text: 'Prima domanda' }]);
    expect(currentChat(state)).toMatchObject({ key: 'draft:0', conversationId: null, title: 'Prima domanda' });
    expect(turnInProgress(currentChat(state))).toBe(true);
  });

  it('keeps the progressive answer and records the outcome', () => {
    const state = run([
      { type: 'turn-started', key: 'draft:0', text: 'ciao' },
      { type: 'turn-accepted', key: 'draft:0', conversationId: 'c-1' },
      { type: 'turn-delta', key: 'draft:0', text: 'Ciao ' },
      { type: 'turn-delta', key: 'draft:0', text: 'a te' },
      { type: 'turn-finished', key: 'draft:0', outcome: { kind: 'completed', answer: 'Ciao a te' } },
    ]);
    const chat = currentChat(state);
    expect(chat.conversationId).toBe('c-1');
    expect(chat.local).toEqual({ text: 'ciao', answer: 'Ciao a te', outcome: { kind: 'completed', answer: 'Ciao a te' } });
    expect(state.announcement).toMatchObject({ chatKey: 'draft:0', outcome: { kind: 'completed' } });
    expect(turnInProgress(chat)).toBe(false);
  });

  it('replaces a finished local turn with the stored history but keeps one in progress', () => {
    const finished = run([
      { type: 'turn-started', key: 'draft:0', text: 'domanda' },
      { type: 'turn-accepted', key: 'draft:0', conversationId: 'c-1' },
      { type: 'turn-finished', key: 'draft:0', outcome: { kind: 'interrupted' } },
      { type: 'history-loaded', history: history('c-1') },
    ]);
    expect(currentChat(finished).local).toBeNull();
    expect(currentChat(finished).history).toEqual(history('c-1'));
    const running = run([
      { type: 'turn-started', key: 'draft:0', text: 'domanda' },
      { type: 'turn-accepted', key: 'draft:0', conversationId: 'c-1' },
      { type: 'history-loaded', history: history('c-1') },
    ]);
    expect(turnInProgress(currentChat(running))).toBe(true);
  });

  it('lets the person leave a chat with a turn in progress and come back to it', () => {
    const state = run([
      { type: 'turn-started', key: 'draft:0', text: 'lenta' },
      { type: 'turn-accepted', key: 'draft:0', conversationId: 'c-slow' },
      { type: 'turn-delta', key: 'draft:0', text: 'metà' },
      { type: 'open-conversation', conversationId: 'c-other' },
      { type: 'turn-started', key: 'c-other', text: 'altra' },
      { type: 'open-conversation', conversationId: 'c-slow' },
    ]);
    expect(currentChat(state).local?.answer).toBe('metà');
    expect(turnInProgress(state.chats['c-other']!)).toBe(true);
  });

  it('drops an unused new chat when another chat is opened', () => {
    const state = run([{ type: 'open-conversation', conversationId: 'c-1' }]);
    expect(Object.keys(state.chats)).toEqual(['c-1']);
    const again = run([{ type: 'new-chat' }, { type: 'new-chat' }], state);
    expect(Object.keys(again.chats)).toEqual(['c-1', 'draft:1']);
  });

  it('records a history error for the conversation', () => {
    const state = run([{ type: 'open-conversation', conversationId: 'missing' },
      { type: 'history-failed', conversationId: 'missing', message: 'Conversazione non trovata.' }]);
    expect(currentChat(state).historyError).toBe('Conversazione non trovata.');
  });
});
