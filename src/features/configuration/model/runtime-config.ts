import { isLanguage, preferredLanguage, type Language } from '../../../shared/i18n/dictionary';
import { err, ok, type Result } from '../../../shared/result';

export type RuntimeConfig = { readonly backendUrl: URL; readonly language: Language };

export type ConfigError =
  | { readonly kind: 'unreadable' }
  | { readonly kind: 'http-status'; readonly status: number }
  | { readonly kind: 'invalid-json' }
  | { readonly kind: 'not-an-object' }
  | { readonly kind: 'missing-backend-url' }
  | { readonly kind: 'invalid-backend-url' }
  | { readonly kind: 'unsupported-language'; readonly value: string }
  | { readonly kind: 'unknown-field'; readonly field: string };

export type FetchConfig = (url: URL, init: RequestInit) => Promise<Response>;

const fields = new Set(['backendUrl', 'language']);

/** Normalises the backend base URL: absolute HTTP(S), no credentials, query or fragment. */
export function parseBackendUrl(value: string): Result<URL, ConfigError> {
  let url: URL;
  try { url = new URL(value); } catch { return err({ kind: 'invalid-backend-url' }); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    return err({ kind: 'invalid-backend-url' });
  }
  url.pathname = url.pathname.replace(/\/?$/, '/');
  return ok(url);
}

export function parseRuntimeConfig(value: unknown, preferences: readonly string[]): Result<RuntimeConfig, ConfigError> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return err({ kind: 'not-an-object' });
  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).find(field => !fields.has(field));
  if (unknown !== undefined) return err({ kind: 'unknown-field', field: unknown });
  if (typeof record.backendUrl !== 'string') return err({ kind: 'missing-backend-url' });
  const backendUrl = parseBackendUrl(record.backendUrl);
  if (!backendUrl.ok) return backendUrl;
  if (record.language === undefined) return ok({ backendUrl: backendUrl.value, language: preferredLanguage(preferences) });
  if (!isLanguage(record.language)) return err({ kind: 'unsupported-language', value: String(record.language) });
  return ok({ backendUrl: backendUrl.value, language: record.language });
}

/** Reads `config.json` next to the page, bypassing the browser cache. */
export async function loadRuntimeConfig(fetchConfig: FetchConfig, configUrl: URL,
  preferences: readonly string[]): Promise<Result<RuntimeConfig, ConfigError>> {
  let response: Response;
  try { response = await fetchConfig(configUrl, { cache: 'no-store' }); } catch { return err({ kind: 'unreadable' }); }
  if (!response.ok) return err({ kind: 'http-status', status: response.status });
  let body: unknown;
  try { body = JSON.parse(await response.text()); } catch { return err({ kind: 'invalid-json' }); }
  return parseRuntimeConfig(body, preferences);
}

/** Technical reason shown next to the configuration error, the same in every language. */
export function describeConfigError(error: ConfigError): string {
  switch (error.kind) {
    case 'unreadable': return 'config.json: cannot be read';
    case 'http-status': return `config.json: HTTP ${error.status}`;
    case 'invalid-json': return 'config.json: invalid JSON';
    case 'not-an-object': return 'config.json: expected a JSON object';
    case 'missing-backend-url': return 'backendUrl: required string';
    case 'invalid-backend-url': return 'backendUrl: absolute http(s) URL without credentials, query or fragment';
    case 'unsupported-language': return `language: unsupported value "${error.value}"`;
    case 'unknown-field': return `unknown field "${error.field}"`;
  }
}
