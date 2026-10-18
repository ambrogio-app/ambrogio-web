// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AnswerMarkdown } from '../../../../src/features/chat/ui/AnswerMarkdown';

afterEach(cleanup);

function renderAnswer(text: string): HTMLElement {
  return render(<AnswerMarkdown text={text} />).container;
}

describe('AnswerMarkdown', () => {
  it('renders headings, lists, code and tables', () => {
    const container = renderAnswer('# Titolo\n\n- uno\n- due\n\n`codice`\n\n| a | b |\n|---|---|\n| 1 | 2 |');
    expect(container.querySelector('h1')?.textContent).toBe('Titolo');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelector('code')?.textContent).toBe('codice');
    expect(container.querySelector('table td')?.textContent).toBe('1');
  });

  it('keeps raw HTML as text', () => {
    const container = renderAnswer('Prima <script>alert(1)</script> e <img src=x onerror="alert(2)">\n\n<div>blocco</div>');
    expect(container.querySelector('script, img')).toBeNull();
    expect(container.querySelectorAll('div')).toHaveLength(1);
    expect(container.textContent).toContain('<script>alert(1)</script>');
    expect(container.textContent).toContain('<div>blocco</div>');
  });

  it('makes only http, https and mailto links clickable, in a new tab', () => {
    const container = renderAnswer('[sito](https://example.com) [posta](mailto:a@example.com) [male](javascript:alert(1))');
    const links = [...container.querySelectorAll('a')];
    expect(links.map(link => link.getAttribute('href'))).toEqual(['https://example.com', 'mailto:a@example.com']);
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
    expect(container.textContent).toContain('male');
  });

  it('never loads images and shows their alternative text', () => {
    const container = renderAnswer('![grafico](https://example.com/g.png) ![locale](data:image/png;base64,AAAA)');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com/g.png');
    expect(container.querySelector('a')?.textContent).toBe('grafico');
    expect(container.textContent).toContain('locale');
  });
});
