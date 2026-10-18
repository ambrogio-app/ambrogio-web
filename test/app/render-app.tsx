import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import type { FakeBrowser } from '../support/fake-browser';

export const ids = {
  stored: '11111111-1111-4111-8111-111111111111',
  other: '22222222-2222-4222-8222-222222222222',
  third: '33333333-3333-4333-8333-333333333333',
  created: '44444444-4444-4444-8444-444444444444',
  missing: '55555555-5555-4555-8555-555555555555',
};

export async function renderApp(browser: FakeBrowser) {
  const user = userEvent.setup();
  render(<App browser={browser} />);
  const navigation = await screen.findByRole('navigation', { hidden: true });
  return { user, navigation };
}

export function sidebarEntries(): string[] {
  return within(screen.getByRole('list')).getAllByRole('button').map(button => button.textContent ?? '');
}

export function currentEntry(): HTMLElement | undefined {
  return within(screen.getByRole('list')).getAllByRole('button').find(button => button.getAttribute('aria-current') === 'true');
}

export function composer(): HTMLTextAreaElement {
  return screen.getByRole('textbox', { name: /Scrivi un messaggio|Write a message/ }) as HTMLTextAreaElement;
}
