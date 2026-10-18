import type { Dictionary, Language } from './dictionary';
import { en } from './en';
import { it } from './it';

export const dictionaries: Readonly<Record<Language, Dictionary>> = { it, en };
