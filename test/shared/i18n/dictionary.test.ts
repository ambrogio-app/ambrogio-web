import { describe, expect, it } from 'vitest';
import { isLanguage, languages, preferredLanguage } from '../../../src/shared/i18n/dictionary';
import { dictionaries } from '../../../src/shared/i18n/dictionaries';

describe('dictionaries', () => {
  it('define every key in every language', () => {
    const keys = Object.keys(dictionaries.it).sort();
    for (const language of languages) expect(Object.keys(dictionaries[language]).sort()).toEqual(keys);
  });

  it('match the texts of the language contract', () => {
    expect(dictionaries.it.pending).toBe('In elaborazione. Aggiorna più tardi per vedere l\'esito.');
    expect(dictionaries.en.pending).toBe('In progress. Refresh later to see the outcome.');
    expect(dictionaries.it.you).toBe('Tu');
    expect(dictionaries.en.you).toBe('You');
    expect(dictionaries.en.ambrogio).toBe('Ambrogio');
    expect(dictionaries.it.conversationNotFound).toBe('Conversazione non trovata.');
    expect(dictionaries.en.conversationNotFound).toBe('Conversation not found.');
    expect(dictionaries.it.httpError(500)).toBe('Il backend ha risposto con un errore (HTTP 500).');
    expect(dictionaries.en.httpError(404)).toBe('The backend answered with an error (HTTP 404).');
  });
});

describe('preferredLanguage', () => {
  it('takes the first supported browser language', () => {
    expect(preferredLanguage(['fr-FR', 'it-IT', 'en'])).toBe('it');
    expect(preferredLanguage(['EN-gb'])).toBe('en');
  });

  it('falls back to English', () => {
    expect(preferredLanguage(['fr', 'de'])).toBe('en');
    expect(preferredLanguage([])).toBe('en');
  });

  it('recognises only supported language codes', () => {
    expect(isLanguage('it')).toBe(true);
    expect(isLanguage('fr')).toBe(false);
    expect(isLanguage(1)).toBe(false);
  });
});
