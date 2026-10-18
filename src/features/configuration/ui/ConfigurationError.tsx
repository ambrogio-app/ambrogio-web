import { useDictionary } from '../../../shared/ui/DictionaryProvider';
import styles from './ConfigurationError.module.css';

export function ConfigurationError({ reason }: { reason: string }) {
  const t = useDictionary();
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t.invalidConfiguration}</h1>
      <p className={styles.reason}><code>{reason}</code></p>
    </main>
  );
}
