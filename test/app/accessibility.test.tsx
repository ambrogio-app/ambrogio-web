// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from '../support/fake-browser';
import { composer, ids, renderApp } from './render-app';

afterEach(cleanup);

function liveRegion(): HTMLElement {
  return document.querySelector('[aria-live="polite"]') as HTMLElement;
}

describe('basic accessibility', () => {
  it('exposes regions, named commands, a labelled field and the current chat', async () => {
    const browser = fakeBrowser();
    browser.server.pageSize = 1;
    browser.server.store(ids.stored, { id: 't-1', text: 'Vecchia', status: 'answered', answer: 'ok' });
    browser.server.store(ids.other, { id: 't-2', text: 'Altra', status: 'answered', answer: 'ok' });
    await renderApp(browser);
    expect(screen.getByRole('navigation', { name: 'Conversazioni' })).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Nuova chat' })).toHaveLength(2);
    for (const name of ['Aggiorna', 'Invia']) expect(screen.getByRole('button', { name })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Altre conversazioni' })).toBeTruthy();
    expect(composer()).toBeTruthy();
    expect(within(screen.getByRole('list')).getByRole('button', { current: true }).textContent).toBe('Nuova chat');
  });

  it('labels every message with its speaker', async () => {
    const browser = fakeBrowser({ fragment: `#/c/${ids.stored}` });
    browser.server.store(ids.stored, { id: 't-1', text: 'Domanda', status: 'answered', answer: 'Risposta' });
    await renderApp(browser);
    await screen.findByText('Risposta');
    expect(screen.getAllByRole('article').map(article => within(article).getByRole('heading').textContent))
      .toEqual(['Tu', 'Ambrogio']);
  });

  it('works from the keyboard alone', async () => {
    const browser = fakeBrowser();
    browser.server.store(ids.stored, { id: 't-1', text: 'Vecchia', status: 'answered', answer: 'Risposta vecchia' });
    const { user } = await renderApp(browser);
    await screen.findByRole('button', { name: 'Vecchia' });
    composer().focus();
    await user.keyboard('Ciao{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(1));
    screen.getByRole('button', { name: 'Vecchia' }).focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByText('Risposta vecchia')).toBeTruthy();
    screen.getAllByRole('button', { name: 'Nuova chat' })[0]!.focus();
    await user.keyboard(' ');
    expect(within(screen.getByRole('list')).getByRole('button', { current: true }).textContent).toBe('Nuova chat');
  });

  it('announces the outcome of a turn but not its fragments', async () => {
    const browser = fakeBrowser();
    const { user } = await renderApp(browser);
    await user.type(composer(), 'Saluto{Enter}');
    await waitFor(() => expect(browser.server.turns).toHaveLength(1));
    act(() => { browser.server.lastTurn().accept(ids.created).chunk('Buon '); });
    await screen.findByText('Buon');
    expect(liveRegion().textContent).toBe('');
    browser.server.store(ids.created, { id: 't-1', text: 'Saluto', status: 'answered', answer: 'Buon giorno' });
    act(() => { browser.server.lastTurn().chunk('giorno').complete(); });
    await waitFor(() => expect(liveRegion().textContent).toBe('Buon giorno'));
  });

  it('defines a visible focus indicator', () => {
    expect(readFileSync('src/app/global.css', 'utf8')).toMatch(/:focus-visible\s*{\s*outline: 3px solid/);
  });
});
