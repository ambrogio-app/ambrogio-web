import type { ReactNode, Ref } from 'react';
import type { Dictionary } from '../../../shared/i18n/dictionary';
import accessibility from '../../../shared/ui/accessibility.module.css';
import { useDictionary } from '../../../shared/ui/DictionaryProvider';
import type { Announcement, Chat, ChatTurn, TurnOutcome } from '../model/chat-state';
import { AnswerMarkdown } from './AnswerMarkdown';
import styles from './ChatPanel.module.css';
import { Composer, type SendAttempt } from './Composer';

export type ChatPanelProps = {
  readonly chat: Chat;
  readonly title: string;
  readonly canSend: boolean;
  readonly announcement: Announcement | null;
  readonly onSend: (text: string) => SendAttempt;
  readonly field?: Ref<HTMLTextAreaElement>;
  readonly toolbar?: ReactNode;
};

function Message({ speaker, own, children }: { speaker: string; own: boolean; children: ReactNode }) {
  return (
    <article className={own ? styles.own : styles.reply}>
      <h3 className={styles.speaker}>{speaker}</h3>
      {children}
    </article>
  );
}

function PlainText({ text }: { text: string }) {
  return <p className={styles.plain}>{text}</p>;
}

function storedReply(turn: ChatTurn, t: Dictionary): ReactNode {
  switch (turn.status) {
    case 'answered': return <AnswerMarkdown text={turn.answer ?? ''} />;
    case 'failed': return <PlainText text={turn.error ?? ''} />;
    case 'pending': return <PlainText text={t.pending} />;
    case 'interrupted': return <PlainText text={t.interrupted} />;
  }
}

function outcomeText(outcome: TurnOutcome, t: Dictionary): string {
  switch (outcome.kind) {
    case 'completed': return outcome.answer;
    case 'failed': return outcome.message;
    case 'interrupted': return t.interrupted;
    case 'unreachable': return t.backendUnreachable;
    case 'protocol': return t.protocolError;
  }
}

function localReply(answer: string, outcome: TurnOutcome | null, t: Dictionary): ReactNode {
  if (outcome === null) {
    return answer ? <AnswerMarkdown text={answer} /> : <p className={styles.waiting} aria-hidden="true">…</p>;
  }
  return outcome.kind === 'completed' ? <AnswerMarkdown text={outcome.answer} /> : <PlainText text={outcomeText(outcome, t)} />;
}

export function ChatPanel({ chat, title, canSend, announcement, onSend, field, toolbar }: ChatPanelProps) {
  const t = useDictionary();
  const announced = announcement !== null && announcement.chatKey === chat.key ? announcement : null;
  return (
    <main className={styles.panel}>
      <header className={styles.header}>
        {toolbar}
        <h1 className={styles.title}>{title}</h1>
      </header>
      <section className={styles.messages}>
        {chat.history?.turns.map(turn => (
          <div key={turn.id} className={styles.exchange}>
            <Message speaker={t.you} own><PlainText text={turn.text} /></Message>
            <Message speaker={t.ambrogio} own={false}>{storedReply(turn, t)}</Message>
          </div>
        ))}
        {chat.local !== null && (
          <div className={styles.exchange}>
            <Message speaker={t.you} own><PlainText text={chat.local.text} /></Message>
            <Message speaker={t.ambrogio} own={false}>{localReply(chat.local.answer, chat.local.outcome, t)}</Message>
          </div>
        )}
        {chat.historyError !== null && <p className={styles.error} role="alert">{chat.historyError}</p>}
      </section>
      <div className={accessibility.visuallyHidden} aria-live="polite">
        {announced && <p key={announced.serial}>{outcomeText(announced.outcome, t)}</p>}
      </div>
      <Composer canSend={canSend} onSend={onSend} {...(field ? { field } : {})} />
    </main>
  );
}
