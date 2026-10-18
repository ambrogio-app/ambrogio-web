import type { FetchConfig } from '../features/configuration/model/runtime-config';
import type { IdentityStorage, RandomBytes } from '../features/session/model/client-identity';
import type { OpenSocket } from '../features/session/model/conversation-session';

/** The page address: its fragment, changed without reloading, and its changes from history. */
export type PageAddress = {
  readonly fragment: () => string;
  readonly push: (fragment: string) => void;
  readonly subscribe: (listener: () => void) => () => void;
};

/** Whether the layout is below 720 pixels, and its changes. */
export type NarrowLayout = {
  readonly matches: () => boolean;
  readonly subscribe: (listener: () => void) => () => void;
};

/** Every browser API the application uses, supplied by `main.tsx` or by tests. */
export type BrowserDependencies = {
  readonly fetch: FetchConfig;
  readonly configUrl: URL;
  readonly languages: readonly string[];
  readonly openSocket: OpenSocket;
  readonly storage: IdentityStorage | undefined;
  readonly userAgent: string;
  readonly randomBytes: RandomBytes;
  readonly address: PageAddress;
  readonly narrowLayout: NarrowLayout;
};
