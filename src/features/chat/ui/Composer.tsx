import { useId, useState, type FormEvent, type KeyboardEvent, type Ref } from 'react';
import accessibility from '../../../shared/ui/accessibility.module.css';
import { useDictionary } from '../../../shared/ui/DictionaryProvider';
import styles from './Composer.module.css';

/** Result of handing a text to the conversation: sent, or refused before it left the page. */
export type SendAttempt = 'sent' | 'empty' | 'too-large';

export type ComposerProps = {
  readonly canSend: boolean;
  readonly onSend: (text: string) => SendAttempt;
  readonly field?: Ref<HTMLTextAreaElement>;
};

export function Composer({ canSend, onSend, field }: ComposerProps) {
  const t = useDictionary();
  const id = useId();
  const [text, setText] = useState('');
  const [refusal, setRefusal] = useState<Exclude<SendAttempt, 'sent'> | null>(null);

  const submit = () => {
    if (!canSend) return;
    const attempt = onSend(text);
    if (attempt === 'sent') { setText(''); setRefusal(null); } else setRefusal(attempt);
  };
  const onSubmit = (event: FormEvent) => { event.preventDefault(); submit(); };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className={styles.composer} onSubmit={onSubmit}>
      <label htmlFor={id} className={accessibility.visuallyHidden}>{t.composerPlaceholder}</label>
      <textarea id={id} ref={field} className={styles.field} rows={3} value={text}
        placeholder={t.composerPlaceholder} onChange={event => setText(event.target.value)} onKeyDown={onKeyDown}
        aria-describedby={refusal === null ? undefined : `${id}-refusal`} />
      <button type="submit" className={styles.send} disabled={!canSend}>{t.send}</button>
      {refusal !== null && (
        <p id={`${id}-refusal`} className={styles.refusal} role="alert">
          {refusal === 'empty' ? t.emptyMessage : t.messageTooLarge}
        </p>
      )}
    </form>
  );
}
