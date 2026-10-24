// @vitest-environment jsdom
import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from '../support/fake-browser';
import { composer, currentEntry, ids, renderApp } from './render-app';

afterEach(cleanup);

describe('chat address', () => {
  it('opens the new chat without a fragment and the named conversation with one', async () => {
    const plain = fakeBrowser();
    await renderApp(plain);
    expect(currentEntry()?.textContent).toBe('Nuova chat');
    expect(plain.pushed).toEqual([]);
    cleanup();

    const named = fakeBrowser({ fragment: `#/c/${ids.stored}` });
    named.server.store(ids.stored, { id: 't-1', text: 'Dal link', status: 'answered', answer: 'Aperta dal link' });
    await renderApp(named);
    expect(await screen.findByText('Aperta dal link')).toBeTruthy();
    expect(named.pushed).toEqual([]);
  });

  // Verification: Prova della presentazione degli errori HTTP
  it('shows the text of a missing conversation and keeps the new chat available', async () => {
    const browser = fakeBrowser({ fragment: `#/c/${ids.missing}` });
    const { user } = await renderApp(browser);
    expect(await screen.findByText('Conversazione non trovata.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Nuova chat' }));
    expect(currentEntry()?.textContent).toBe('Nuova chat');
    expect(browser.pushed.at(-1)).toBe('');
  });

  // Verification: Prova della presentazione degli errori HTTP
  it('presents HTTP errors by problem type in the interface language, never the backend texts', async () => {
    const english = fakeBrowser({ fragment: `#/c/${ids.missing}`,
      config: { backendUrl: 'https://ambrogio.example.com', language: 'en' } });
    await renderApp(english);
    expect(await screen.findByText('Conversation not found.')).toBeTruthy();
    cleanup();
    const failing = fakeBrowser({ fragment: `#/c/${ids.stored}` });
    failing.server.store(ids.stored, { id: 't-1', text: 'Prima', status: 'answered', answer: 'ok' });
    failing.server.unreadable.add(ids.stored);
    await renderApp(failing);
    expect(await screen.findByText('Il backend ha risposto con un errore (HTTP 500).')).toBeTruthy();
    expect(screen.queryByText(/Internal Server Error/)).toBeNull();
  });

  it('ignores a fragment of another form', async () => {
    const browser = fakeBrowser({ fragment: '#/c/not-a-conversation' });
    await renderApp(browser);
    expect(currentEntry()?.textContent).toBe('Nuova chat');
    expect(browser.server.requests).toEqual(['/api/v1/conversations']);
  });

  it('updates the fragment when a chat is opened or accepted and follows the history', async () => {
    const browser = fakeBrowser();
    browser.server.store(ids.stored, { id: 't-1', text: 'Prima', status: 'answered', answer: 'Risposta prima' });
    const { user } = await renderApp(browser);
    await user.click(await screen.findByRole('button', { name: 'Prima' }));
    expect(browser.pushed).toEqual([`#/c/${ids.stored}`]);

    await user.click(screen.getByRole('button', { name: 'Nuova chat' }));
    await user.type(composer(), 'Nuova domanda{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(1));
    act(() => { browser.server.lastTurn().accept(ids.created); });
    await waitFor(() => expect(browser.pushed).toEqual([`#/c/${ids.stored}`, '', `#/c/${ids.created}`]));

    act(() => browser.setFragment(`#/c/${ids.stored}`));
    expect(await screen.findByText('Risposta prima')).toBeTruthy();
    expect(currentEntry()?.textContent).toBe('Prima');
  });
});
