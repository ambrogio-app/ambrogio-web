import { createContext, useContext, type ReactNode } from 'react';
import type { Dictionary } from '../i18n/dictionary';
import { en } from '../i18n/en';

const DictionaryContext = createContext<Dictionary>(en);

export function DictionaryProvider({ dictionary, children }: { dictionary: Dictionary; children: ReactNode }) {
  return <DictionaryContext.Provider value={dictionary}>{children}</DictionaryContext.Provider>;
}

export function useDictionary(): Dictionary {
  return useContext(DictionaryContext);
}
