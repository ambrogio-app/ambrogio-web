import { useEffect, useState } from 'react';
import { describeConfigError, loadRuntimeConfig, type RuntimeConfig } from '../features/configuration/model/runtime-config';
import { ConfigurationError } from '../features/configuration/ui/ConfigurationError';
import { preferredLanguage } from '../shared/i18n/dictionary';
import { dictionaries } from '../shared/i18n/dictionaries';
import { DictionaryProvider } from '../shared/ui/DictionaryProvider';
import './App.module.css';
import type { BrowserDependencies } from './browser';
import { ChatApplication } from './ChatApplication';

type Loading = { readonly state: 'loading' } | { readonly state: 'invalid'; readonly reason: string }
  | { readonly state: 'ready'; readonly config: RuntimeConfig };

export function App({ browser }: { browser: BrowserDependencies }) {
  const [loading, setLoading] = useState<Loading>({ state: 'loading' });

  useEffect(() => {
    let active = true;
    void loadRuntimeConfig(browser.fetch, browser.configUrl, browser.languages).then(result => {
      if (!active) return;
      setLoading(result.ok ? { state: 'ready', config: result.value }
        : { state: 'invalid', reason: describeConfigError(result.error) });
    });
    return () => { active = false; };
  }, [browser]);

  if (loading.state === 'loading') return null;
  if (loading.state === 'invalid') {
    return (
      <DictionaryProvider dictionary={dictionaries[preferredLanguage(browser.languages)]}>
        <ConfigurationError reason={loading.reason} />
      </DictionaryProvider>
    );
  }
  return (
    <DictionaryProvider dictionary={dictionaries[loading.config.language]}>
      <ChatApplication browser={browser} config={loading.config} />
    </DictionaryProvider>
  );
}
