import { describe, expect, it, vi } from 'vitest';
import {
  describeConfigError, loadRuntimeConfig, parseRuntimeConfig, type ConfigError,
} from '../../../../src/features/configuration/model/runtime-config';

const configUrl = new URL('https://web.example.com/config.json');

function serve(body: string, status = 200) {
  return vi.fn(async () => new Response(body, { status }));
}

function failure(value: unknown, preferences: readonly string[] = []): ConfigError {
  const result = parseRuntimeConfig(value, preferences);
  if (result.ok) throw new Error('expected an invalid configuration');
  return result.error;
}

describe('loadRuntimeConfig', () => {
  it('reads backendUrl and language without using the browser cache', async () => {
    const fetchConfig = serve('{"backendUrl":"https://ambrogio.example.com/base","language":"it"}');
    const result = await loadRuntimeConfig(fetchConfig, configUrl, ['en']);
    expect(result.ok && result.value.backendUrl.href).toBe('https://ambrogio.example.com/base/');
    expect(result.ok && result.value.language).toBe('it');
    expect(fetchConfig).toHaveBeenCalledWith(configUrl, { cache: 'no-store' });
  });

  it('follows the browser preferences when language is missing', async () => {
    const it1 = await loadRuntimeConfig(serve('{"backendUrl":"http://ambrogio.example.com"}'), configUrl, ['it-IT']);
    const fallback = await loadRuntimeConfig(serve('{"backendUrl":"http://ambrogio.example.com"}'), configUrl, ['fr']);
    expect(it1.ok && it1.value.language).toBe('it');
    expect(fallback.ok && fallback.value.language).toBe('en');
  });

  it('reports a missing file, an unreachable file and malformed JSON', async () => {
    const missing = await loadRuntimeConfig(serve('', 404), configUrl, []);
    const unreachable = await loadRuntimeConfig(vi.fn(async () => { throw new TypeError('network'); }), configUrl, []);
    const malformed = await loadRuntimeConfig(serve('{'), configUrl, []);
    expect(!missing.ok && missing.error).toEqual({ kind: 'http-status', status: 404 });
    expect(!unreachable.ok && unreachable.error).toEqual({ kind: 'unreadable' });
    expect(!malformed.ok && malformed.error).toEqual({ kind: 'invalid-json' });
  });
});

describe('parseRuntimeConfig', () => {
  it('rejects every shape outside the contract', () => {
    expect(failure([])).toEqual({ kind: 'not-an-object' });
    expect(failure({})).toEqual({ kind: 'missing-backend-url' });
    expect(failure({ backendUrl: 'ftp://ambrogio.example.com' })).toEqual({ kind: 'invalid-backend-url' });
    expect(failure({ backendUrl: '/relative' })).toEqual({ kind: 'invalid-backend-url' });
    expect(failure({ backendUrl: 'https://user:secret@ambrogio.example.com' })).toEqual({ kind: 'invalid-backend-url' });
    expect(failure({ backendUrl: 'https://ambrogio.example.com/?q=1' })).toEqual({ kind: 'invalid-backend-url' });
    expect(failure({ backendUrl: 'https://ambrogio.example.com/#x' })).toEqual({ kind: 'invalid-backend-url' });
    expect(failure({ backendUrl: 'https://ambrogio.example.com', language: 'fr' }))
      .toEqual({ kind: 'unsupported-language', value: 'fr' });
    expect(failure({ backendURL: 'https://ambrogio.example.com' })).toEqual({ kind: 'unknown-field', field: 'backendURL' });
  });

  it('describes every error with a technical reason', () => {
    expect(describeConfigError({ kind: 'unknown-field', field: 'backendURL' })).toBe('unknown field "backendURL"');
    expect(describeConfigError({ kind: 'http-status', status: 404 })).toBe('config.json: HTTP 404');
  });
});
