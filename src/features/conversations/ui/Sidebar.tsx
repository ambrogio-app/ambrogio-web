import type { KeyboardEvent, Ref } from 'react';
import { useDictionary } from '../../../shared/ui/DictionaryProvider';
import styles from './Sidebar.module.css';

export type SidebarEntry = { readonly key: string; readonly label: string; readonly current: boolean };

export type SidebarProps = {
  readonly id: string;
  readonly entries: readonly SidebarEntry[];
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly hidden: boolean;
  readonly firstControl?: Ref<HTMLButtonElement>;
  readonly onSelect: (key: string) => void;
  readonly onNewChat: () => void;
  readonly onRefresh: () => void;
  readonly onMore: () => void;
  readonly onEscape?: () => void;
};

export function Sidebar(props: SidebarProps) {
  const t = useDictionary();
  const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.onEscape) { event.preventDefault(); props.onEscape(); }
  };
  return (
    <nav id={props.id} className={styles.sidebar} aria-label={t.conversations} hidden={props.hidden}
      onKeyDown={escape}>
      <div className={styles.commands}>
        <button type="button" ref={props.firstControl} onClick={props.onNewChat}>{t.newChat}</button>
        <button type="button" onClick={props.onRefresh} disabled={props.loading}>{t.refresh}</button>
      </div>
      {props.error !== null && <p className={styles.error} role="alert">{props.error}</p>}
      <ul className={styles.list}>
        {props.entries.map(entry => (
          <li key={entry.key}>
            <button type="button" className={styles.entry} aria-current={entry.current ? 'true' : undefined}
              onClick={() => props.onSelect(entry.key)}>{entry.label}</button>
          </li>
        ))}
      </ul>
      {props.hasMore && (
        <button type="button" className={styles.more} onClick={props.onMore} disabled={props.loading}>
          {t.moreConversations}
        </button>
      )}
    </nav>
  );
}
