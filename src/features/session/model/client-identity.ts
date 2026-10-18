export type ClientIdentity = { readonly clientId: string; readonly name: string };

/** The part of `Storage` the identity needs; any method may throw when storage is blocked. */
export type IdentityStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type RandomBytes = (bytes: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>;

export const clientIdKey = 'ambrogio.web.clientId';

const storedClientId = /^web-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** UUID v4 from `crypto.getRandomValues`, which also exists on pages served over plain HTTP. */
export function uuidV4(random: RandomBytes): string {
  const bytes = random(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function browserName(userAgent: string): string {
  if (/\bEdg(e|A|iOS)?\//.test(userAgent)) return 'Web Edge';
  if (/\b(Firefox|FxiOS)\//.test(userAgent)) return 'Web Firefox';
  if (/\b(Chrome|Chromium|CriOS)\//.test(userAgent)) return 'Web Chrome';
  if (/\bSafari\//.test(userAgent) && /\bVersion\//.test(userAgent)) return 'Web Safari';
  return 'Web browser';
}

/** The identity kept for this browser, or one valid only for this page when storage is unavailable. */
export function clientIdentity(storage: IdentityStorage | undefined, userAgent: string,
  random: RandomBytes): ClientIdentity {
  const name = browserName(userAgent);
  try {
    const stored = storage?.getItem(clientIdKey);
    if (stored && storedClientId.test(stored)) return { clientId: stored, name };
  } catch { /* blocked storage: fall back to a page identity */ }
  const clientId = `web-${uuidV4(random)}`;
  try { storage?.setItem(clientIdKey, clientId); } catch { /* the identity lasts for this page only */ }
  return { clientId, name };
}
