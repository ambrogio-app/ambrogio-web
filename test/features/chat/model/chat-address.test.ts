import { describe, expect, it } from 'vitest';
import { conversationFromFragment, fragmentForConversation } from '../../../../src/features/chat/model/chat-address';

const id = '3f2b8c1e-5d4a-4e6f-9a8b-7c6d5e4f3a2b';

describe('chat address', () => {
  it('reads the conversation of #/c/<id> and ignores other fragments', () => {
    expect(conversationFromFragment(`#/c/${id}`)).toBe(id);
    expect(conversationFromFragment('')).toBeNull();
    expect(conversationFromFragment('#/c/not-an-id')).toBeNull();
    expect(conversationFromFragment(`#/x/${id}`)).toBeNull();
  });

  it('writes the fragment of a conversation and the empty fragment of a new chat', () => {
    expect(fragmentForConversation(id)).toBe(`#/c/${id}`);
    expect(fragmentForConversation(null)).toBe('');
  });
});
