import { describe, expect, it } from 'vitest';
import {
  browserName, clientIdentity, clientIdKey, uuidV4, type IdentityStorage,
} from '../../../../src/features/session/model/client-identity';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const firefox = 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0';
const chrome = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const edge = `${chrome} Edg/140.0.0.0`;
const safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15';

function memoryStorage(initial: Record<string, string> = {}): IdentityStorage & { values: Record<string, string> } {
  const values = { ...initial };
  return { values, getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = value; } };
}

const random = (bytes: Uint8Array<ArrayBuffer>) => crypto.getRandomValues(bytes);

describe('uuidV4', () => {
  it('produces version 4 UUIDs from random bytes without crypto.randomUUID', () => {
    const first = uuidV4(random);
    expect(first).toMatch(uuid);
    expect(uuidV4(random)).not.toBe(first);
  });
});

describe('browserName', () => {
  it('names the browser from the user agent', () => {
    expect(browserName(firefox)).toBe('Web Firefox');
    expect(browserName(chrome)).toBe('Web Chrome');
    expect(browserName(edge)).toBe('Web Edge');
    expect(browserName(safari)).toBe('Web Safari');
    expect(browserName('curl/8.0')).toBe('Web browser');
  });
});

describe('clientIdentity', () => {
  it('generates, keeps and reuses web-<UUID v4>', () => {
    const storage = memoryStorage();
    const first = clientIdentity(storage, firefox, random);
    expect(first.clientId).toMatch(/^web-/);
    expect(first.clientId.slice(4)).toMatch(uuid);
    expect(storage.values[clientIdKey]).toBe(first.clientId);
    expect(clientIdentity(storage, firefox, random)).toEqual(first);
  });

  it('replaces a stored value that does not conform', () => {
    const storage = memoryStorage({ [clientIdKey]: 'web-not-a-uuid' });
    const identity = clientIdentity(storage, chrome, random);
    expect(identity.clientId).not.toBe('web-not-a-uuid');
    expect(storage.values[clientIdKey]).toBe(identity.clientId);
  });

  it('uses a page identity when storage is blocked or missing', () => {
    const blocked: IdentityStorage = {
      getItem: () => { throw new DOMException('blocked', 'SecurityError'); },
      setItem: () => { throw new DOMException('blocked', 'SecurityError'); },
    };
    expect(clientIdentity(blocked, safari, random).clientId.slice(4)).toMatch(uuid);
    expect(clientIdentity(undefined, safari, random)).toMatchObject({ name: 'Web Safari' });
  });
});
