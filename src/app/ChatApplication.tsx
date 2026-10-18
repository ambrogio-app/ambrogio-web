import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { conversationFromFragment, fragmentForConversation } from '../features/chat/model/chat-address';
import {
  chatReducer, currentChat, initialChatState, turnInProgress, type ChatState, type TurnOutcome,
} from '../features/chat/model/chat-state';
import { ChatPanel } from '../features/chat/ui/ChatPanel';
import type { SendAttempt } from '../features/chat/ui/Composer';
import type { RuntimeConfig } from '../features/configuration/model/runtime-config';
import {
  conversationListReducer, entryLabel, initialConversationList, previewText, shortId,
} from '../features/conversations/model/conversation-list';
import { ConversationsApi, type ReadFailure } from '../features/conversations/model/conversations-api';
import { Sidebar, type SidebarEntry } from '../features/conversations/ui/Sidebar';
import { clientIdentity, uuidV4 } from '../features/session/model/client-identity';
import {
  ConversationSession, validateTurnText, type CompletedTurn, type TurnFailure,
} from '../features/session/model/conversation-session';
import type { Dictionary } from '../shared/i18n/dictionary';
import type { Result } from '../shared/result';
import { useDictionary } from '../shared/ui/DictionaryProvider';
import type { BrowserDependencies, PageAddress } from './browser';
import styles from './ChatApplication.module.css';

const sidebarId = 'conversations';

function initialChat(address: PageAddress): ChatState {
  const conversationId = conversationFromFragment(address.fragment());
  return conversationId === null ? initialChatState
    : chatReducer(initialChatState, { type: 'open-conversation', conversationId });
}

function readFailureMessage(failure: ReadFailure, t: Dictionary): string {
  switch (failure.kind) {
    case 'unreachable': return t.backendUnreachable;
    case 'invalid-response': return t.protocolError;
    case 'http-error': return failure.message ?? t.protocolError;
  }
}

function turnOutcome(result: Result<CompletedTurn, TurnFailure>): TurnOutcome {
  if (result.ok) return { kind: 'completed', answer: result.value.answer };
  switch (result.error.kind) {
    case 'rejected':
    case 'failed': return { kind: 'failed', message: result.error.message };
    case 'interrupted': return { kind: 'interrupted' };
    case 'protocol': return { kind: 'protocol' };
    default: return { kind: 'unreachable' };
  }
}

function useNarrowLayout(browser: BrowserDependencies): boolean {
  const [narrow, setNarrow] = useState(() => browser.narrowLayout.matches());
  useEffect(() => browser.narrowLayout.subscribe(() => setNarrow(browser.narrowLayout.matches())), [browser]);
  return narrow;
}

/** Connects the chat, conversation list and session features to the browser. */
export function ChatApplication({ browser, config }: { browser: BrowserDependencies; config: RuntimeConfig }) {
  const t = useDictionary();
  const services = useMemo(() => ({
    api: new ConversationsApi(config.backendUrl, browser.fetch),
    session: new ConversationSession(config.backendUrl, {
      openSocket: browser.openSocket,
      identity: clientIdentity(browser.storage, browser.userAgent, browser.randomBytes),
      newId: () => uuidV4(browser.randomBytes),
    }),
  }), [browser, config]);
  useEffect(() => () => { void services.session.close(); }, [services]);

  const [chat, dispatchChat] = useReducer(chatReducer, browser.address, initialChat);
  const [list, dispatchList] = useReducer(conversationListReducer, initialConversationList);
  const chatState = useRef(chat);
  chatState.current = chat;
  const listState = useRef(list);
  listState.current = list;

  const narrow = useNarrowLayout(browser);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelToggle = useRef<HTMLButtonElement>(null);
  const firstSidebarControl = useRef<HTMLButtonElement>(null);
  const composerField = useRef<HTMLTextAreaElement>(null);

  const loadHistory = useCallback(async (conversationId: string) => {
    const result = await services.api.history(conversationId);
    if (result.ok) dispatchChat({ type: 'history-loaded', history: result.value });
    else dispatchChat({ type: 'history-failed', conversationId, message: readFailureMessage(result.error, t) });
  }, [services, t]);

  const loadPage = useCallback(async (cursor?: string) => {
    dispatchList({ type: cursor === undefined ? 'refresh-started' : 'more-started' });
    const result = await services.api.list(cursor);
    if (!result.ok) {
      dispatchList({ type: 'page-failed', message: readFailureMessage(result.error, t) });
      return;
    }
    const known = new Set(listState.current.entries.filter(entry => entry.preview !== undefined).map(entry => entry.id));
    dispatchList({ type: 'page-loaded', items: result.value.items, nextCursor: result.value.nextCursor,
      append: cursor !== undefined });
    await Promise.all(result.value.items.filter(item => !known.has(item.id)).map(async item => {
      const history = await services.api.history(item.id);
      dispatchList({ type: 'preview-loaded', id: item.id,
        preview: history.ok ? history.value.turns[0]?.text ?? null : null });
    }));
  }, [services, t]);

  const openConversation = useCallback((conversationId: string) => {
    dispatchChat({ type: 'open-conversation', conversationId });
    void loadHistory(conversationId);
  }, [loadHistory]);

  useEffect(() => {
    void loadPage();
    const initial = currentChat(chatState.current).conversationId;
    if (initial !== null) void loadHistory(initial);
  }, [loadPage, loadHistory]);

  const current = currentChat(chat);

  useEffect(() => {
    const fragment = fragmentForConversation(current.conversationId);
    if (browser.address.fragment() !== fragment) browser.address.push(fragment);
  }, [browser, current.conversationId]);

  useEffect(() => browser.address.subscribe(() => {
    const conversationId = conversationFromFragment(browser.address.fragment());
    const shown = currentChat(chatState.current).conversationId;
    if (conversationId === shown) return;
    if (conversationId === null) dispatchChat({ type: 'new-chat' });
    else openConversation(conversationId);
  }), [browser, openConversation]);

  useEffect(() => {
    if (panelOpen) firstSidebarControl.current?.focus();
  }, [panelOpen]);

  const closePanel = (focus: 'toggle' | 'composer') => {
    if (!narrow) return;
    setPanelOpen(false);
    queueMicrotask(() => (focus === 'toggle' ? panelToggle : composerField).current?.focus());
  };

  const send = (text: string): SendAttempt => {
    const valid = validateTurnText(text);
    if (!valid.ok) return valid.error.kind === 'too-large' ? 'too-large' : 'empty';
    const chatAtSend = currentChat(chatState.current);
    if (turnInProgress(chatAtSend)) return 'sent';
    const key = chatAtSend.key;
    let conversationId = chatAtSend.conversationId;
    dispatchChat({ type: 'turn-started', key, text });
    void services.session.send(text, conversationId, {
      accepted: accepted => {
        if (conversationId === null) dispatchList({ type: 'conversation-created', id: accepted, preview: text });
        conversationId = accepted;
        dispatchChat({ type: 'turn-accepted', key, conversationId: accepted });
      },
      delta: fragment => dispatchChat({ type: 'turn-delta', key, text: fragment }),
    }).then(result => {
      dispatchChat({ type: 'turn-finished', key, outcome: turnOutcome(result) });
      if (conversationId !== null) void loadHistory(conversationId);
    });
    return 'sent';
  };

  const entries: SidebarEntry[] = list.entries.map(entry => ({ key: entry.id, label: entryLabel(entry),
    current: entry.id === current.conversationId }));
  const title = current.title !== null ? previewText(current.title)
    : current.conversationId !== null ? shortId(current.conversationId) : t.newChat;
  if (!entries.some(entry => entry.current)) entries.unshift({ key: current.key, label: title, current: true });

  const toolbar = narrow ? (
    <button type="button" ref={panelToggle} className={styles.toggle} aria-controls={sidebarId}
      aria-expanded={panelOpen} onClick={() => setPanelOpen(true)}>{t.conversations}</button>
  ) : null;

  return (
    <div className={narrow ? styles.narrow : styles.wide}>
      <Sidebar id={sidebarId} entries={entries} hasMore={list.nextCursor !== null} loading={list.loading}
        error={list.error} hidden={narrow && !panelOpen} firstControl={firstSidebarControl}
        onSelect={key => {
          if (key !== current.key) openConversation(key);
          closePanel('composer');
        }}
        onNewChat={() => { dispatchChat({ type: 'new-chat' }); closePanel('composer'); }}
        onRefresh={() => {
          void loadPage();
          if (current.conversationId !== null) void loadHistory(current.conversationId);
        }}
        onMore={() => { if (list.nextCursor !== null) void loadPage(list.nextCursor); }}
        onEscape={() => closePanel('toggle')} />
      <ChatPanel chat={current} title={title} canSend={!turnInProgress(current)} announcement={chat.announcement}
        onSend={send} field={composerField} toolbar={toolbar} />
    </div>
  );
}
