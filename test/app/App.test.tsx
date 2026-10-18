// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';
import { fakeBrowser } from '../support/fake-browser';

afterEach(cleanup);

describe('App', () => {
  it('shows the configuration error with its reason and never contacts the backend', async () => {
    const browser = fakeBrowser({ config: { backendURL: 'https://ambrogio.example.com' }, languages: ['it'] });
    render(<App browser={browser} />);
    expect(await screen.findByRole('heading', { name: 'Configurazione del client web non valida' })).toBeTruthy();
    expect(screen.getByText('unknown field "backendURL"')).toBeTruthy();
    expect(browser.server.requests).toEqual([]);
    expect(browser.server.sockets).toEqual([]);
  });

  it('writes the configuration error in the browser language', async () => {
    render(<App browser={fakeBrowser({ config: { language: 'en' }, languages: ['fr', 'en-US'] })} />);
    expect(await screen.findByRole('heading', { name: 'Invalid web client configuration' })).toBeTruthy();
  });
});
