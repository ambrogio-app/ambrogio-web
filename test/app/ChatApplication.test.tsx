// @vitest-environment jsdom
import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from '../support/fake-browser';
import { composer, currentEntry, ids, renderApp, sidebarEntries } from './render-app';

afterEach(cleanup);

describe('chat screen', () => {
  it('starts on a new chat, streams the answer and names the entry after the first message', async () => {
    const browser = fakeBrowser();
    const { user } = await renderApp(browser);
    expect(sidebarEntries()).toEqual(['Nuova chat']);
    expect(currentEntry()?.textContent).toBe('Nuova chat');

    await user.type(composer(), 'Che tempo fa domani?{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(1));
    expect(composer().value).toBe('');
    const turn = browser.server.lastTurn();
    expect(turn.conversationId).toBeNull();
    act(() => { turn.accept(ids.created).chunk('Domani '); });
    expect(await screen.findByText('Domani')).toBeTruthy();
    expect(currentEntry()?.textContent).toBe('Che tempo fa domani?');
    expect(browser.pushed).toContain(`#/c/${ids.created}`);

    browser.server.store(ids.created, { id: 't-1', text: 'Che tempo fa domani?', status: 'answered',
      answer: 'Domani sole.' });
    act(() => { turn.chunk('sole.').complete(); });
    expect(await screen.findByText('Domani sole.')).toBeTruthy();
    expect(browser.server.requests).toContain(`/api/v1/conversations/${ids.created}`);
  });

  it('opens a conversation started by another client and continues it', async () => {
    const browser = fakeBrowser();
    browser.server.store(ids.stored, { id: 't-1', text: 'Accendi la luce', status: 'answered', answer: 'Fatto.' });
    const { user } = await renderApp(browser);
    await user.click(await screen.findByRole('button', { name: 'Accendi la luce' }));
    expect(await screen.findByText('Fatto.')).toBeTruthy();
    expect(currentEntry()?.textContent).toBe('Accendi la luce');

    await user.type(composer(), 'Grazie{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(1));
    expect(browser.server.lastTurn().conversationId).toBe(ids.stored);
    expect(browser.server.received.find(message => message.type === 'input.start'))
      .toMatchObject({ conversationId: ids.stored, reply: 'text', content: { type: 'text' } });
  });

  it('pages the list, shows previews or short identifiers and restarts from the first page on refresh', async () => {
    const browser = fakeBrowser();
    browser.server.pageSize = 2;
    browser.server.store(ids.stored, { id: 't-1', text: 'x'.repeat(80), status: 'answered', answer: 'ok' });
    browser.server.store(ids.other, { id: 't-2', text: 'Seconda', status: 'answered', answer: 'ok' });
    browser.server.store(ids.third, { id: 't-3', text: 'Terza', status: 'answered', answer: 'ok' });
    browser.server.unreadable.add(ids.third);
    const { user } = await renderApp(browser);
    await screen.findByRole('button', { name: 'Seconda' });
    expect(sidebarEntries()[1]).toBe(`${'x'.repeat(59)}…`);

    await user.click(screen.getByRole('button', { name: 'Altre conversazioni' }));
    expect(await screen.findByRole('button', { name: ids.third.slice(0, 8) })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Altre conversazioni' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Aggiorna' }));
    await waitFor(() => expect(browser.server.requests.filter(path => path === '/api/v1/conversations')).toHaveLength(2));
    expect(browser.server.requests).toContain('/api/v1/conversations?cursor=2');
  });

  it('shows a turn in progress with the invitation to refresh, then its outcome', async () => {
    const browser = fakeBrowser({ fragment: `#/c/${ids.stored}` });
    browser.server.store(ids.stored, { id: 't-1', text: 'Prenota', status: 'pending' },
      { id: 't-0', text: 'Prima', status: 'interrupted' });
    const { user } = await renderApp(browser);
    expect(await screen.findByText('In elaborazione. Aggiorna più tardi per vedere l\'esito.')).toBeTruthy();
    expect(screen.getByText('Risposta interrotta.')).toBeTruthy();

    browser.server.store(ids.stored, { id: 't-1', text: 'Prenota', status: 'failed', error: 'Prenotazione fallita.' });
    await user.click(screen.getByRole('button', { name: 'Aggiorna' }));
    expect(await screen.findByText('Prenotazione fallita.')).toBeTruthy();
    expect(screen.queryByText(/In elaborazione/)).toBeNull();
  });

  it('keeps other chats usable during a turn and blocks only the busy one', async () => {
    const browser = fakeBrowser();
    browser.server.store(ids.stored, { id: 't-1', text: 'Vecchia', status: 'answered', answer: 'ok' });
    const { user } = await renderApp(browser);
    await user.type(composer(), 'Domanda lenta{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(1));
    act(() => { browser.server.lastTurn().accept(ids.created).chunk('Sto pensando'); });
    expect(screen.getByRole('button', { name: 'Invia' })).toHaveProperty('disabled', true);

    await user.click(await screen.findByRole('button', { name: 'Vecchia' }));
    expect(screen.getByRole('button', { name: 'Invia' })).toHaveProperty('disabled', false);
    await user.type(composer(), 'Altra domanda{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(2));
    expect(browser.server.lastTurn().conversationId).toBe(ids.stored);

    await user.click(screen.getByRole('button', { name: 'Domanda lenta' }));
    expect(screen.getByText('Sto pensando')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Invia' })).toHaveProperty('disabled', true);
    await user.click(screen.getByRole('button', { name: 'Nuova chat' }));
    expect(currentEntry()?.textContent).toBe('Nuova chat');
  });

  it('sends with Enter, adds a line with Shift+Enter and refuses empty messages locally', async () => {
    const browser = fakeBrowser();
    const { user } = await renderApp(browser);
    await user.type(composer(), '   {Enter}');
    expect(await screen.findByText('Scrivi un messaggio non vuoto.')).toBeTruthy();
    expect(browser.server.sockets).toHaveLength(0);

    await user.clear(composer());
    await user.type(composer(), 'riga uno{Shift>}{Enter}{/Shift}riga due');
    expect(composer().value).toBe('riga uno\nriga due');
    await user.click(screen.getByRole('button', { name: 'Invia' }));
    await waitFor(() => expect(browser.server.lastTurn()?.text).toBe('riga uno\nriga due'));
  });

  it('shows rejections, failures and interruptions of a turn', async () => {
    const browser = fakeBrowser();
    const { user } = await renderApp(browser);
    await user.type(composer(), 'uno{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(1));
    act(() => browser.server.lastTurn().reject('Il servizio non è disponibile.'));
    expect(await screen.findAllByText('Il servizio non è disponibile.')).toHaveLength(2);

    await user.type(composer(), 'due{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(2));
    act(() => { browser.server.lastTurn().accept(ids.created).chunk('frammento'); });
    act(() => browser.server.lastTurn().fail('Non riesco a completare la risposta.'));
    expect(await screen.findAllByText('Non riesco a completare la risposta.')).toHaveLength(2);
    expect(screen.queryByText('frammento')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Nuova chat' }));
    await user.type(composer(), 'tre{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(3));
    act(() => { browser.server.lastTurn().accept(ids.other).interrupt(); });
    expect(await screen.findAllByText('Risposta interrotta.')).toHaveLength(2);
  });

  it('uses the English dictionary when configured', async () => {
    const browser = fakeBrowser({ config: { backendUrl: 'https://ambrogio.example.com', language: 'en' } });
    await renderApp(browser);
    expect(screen.getByRole('navigation', { name: 'Conversations' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
    expect(within(screen.getByRole('list')).getByRole('button').textContent).toBe('New chat');
  });
});

describe('narrow layout', () => {
  it('opens the conversations panel with focus inside, closes it with Esc and on choosing a chat', async () => {
    const browser = fakeBrowser({ narrow: true });
    browser.server.store(ids.stored, { id: 't-1', text: 'Vecchia', status: 'answered', answer: 'ok' });
    const { user, navigation } = await renderApp(browser);
    expect(navigation.hidden).toBe(true);
    const toggle = screen.getByRole('button', { name: 'Conversazioni' });

    await user.click(toggle);
    expect(navigation.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Nuova chat'));
    await user.keyboard('{Escape}');
    expect(navigation.hidden).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(toggle));

    await user.click(toggle);
    await user.click(await within(navigation).findByRole('button', { name: 'Vecchia' }));
    expect(navigation.hidden).toBe(true);
    expect(await screen.findByText('ok')).toBeTruthy();
  });
});
