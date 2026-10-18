import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { BrowserDependencies } from './browser';

function localStorageOrUndefined(): Storage | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

const narrowQuery = window.matchMedia('(max-width: 719.98px)');

const browser: BrowserDependencies = {
  fetch: (url, init) => window.fetch(url, init),
  configUrl: new URL('config.json', document.baseURI),
  languages: navigator.languages,
  openSocket: (url, protocol) => new WebSocket(url, protocol),
  storage: localStorageOrUndefined(),
  userAgent: navigator.userAgent,
  randomBytes: bytes => crypto.getRandomValues(bytes),
  address: {
    fragment: () => window.location.hash,
    push: fragment => window.history.pushState(null, '',
      fragment === '' ? window.location.pathname + window.location.search : fragment),
    subscribe: listener => {
      window.addEventListener('popstate', listener);
      window.addEventListener('hashchange', listener);
      return () => {
        window.removeEventListener('popstate', listener);
        window.removeEventListener('hashchange', listener);
      };
    },
  },
  narrowLayout: {
    matches: () => narrowQuery.matches,
    subscribe: listener => {
      narrowQuery.addEventListener('change', listener);
      return () => narrowQuery.removeEventListener('change', listener);
    },
  },
};

createRoot(document.getElementById('root')!).render(<StrictMode><App browser={browser} /></StrictMode>);
