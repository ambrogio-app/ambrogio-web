import type { ReactNode } from 'react';
import Markdown, { type Components, type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './AnswerMarkdown.module.css';

type MarkdownNode = { type: string; value?: string; children?: MarkdownNode[] };
type Pluggable = NonNullable<Options['remarkPlugins']>[number];

const linkSchemes = new Set(['http:', 'https:', 'mailto:']);
const imageLinkSchemes = new Set(['http:', 'https:']);

function scheme(url: string | undefined): string | null {
  if (!url) return null;
  try { return new URL(url).protocol; } catch { return null; }
}

/** Raw HTML in an answer stays visible as text instead of becoming markup. */
function rawHtmlAsText(node: MarkdownNode): void {
  if (node.type === 'html') node.type = 'text';
  node.children?.forEach(rawHtmlAsText);
}

const keepRawHtmlAsText: Pluggable = () => (tree: MarkdownNode) => rawHtmlAsText(tree);

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

const components: Components = {
  a: ({ href, children }) => linkSchemes.has(scheme(href) ?? '')
    ? <ExternalLink href={href!}>{children}</ExternalLink> : <span>{children}</span>,
  img: ({ src, alt }) => {
    const label = alt || (typeof src === 'string' ? src : '');
    return typeof src === 'string' && imageLinkSchemes.has(scheme(src) ?? '')
      ? <ExternalLink href={src}>{label}</ExternalLink> : <span>{label}</span>;
  },
};

/** An answer of Ambrogio rendered as Markdown without HTML, external resources or unsafe links. */
export function AnswerMarkdown({ text }: { text: string }) {
  return (
    <div className={styles.markdown}>
      <Markdown remarkPlugins={[remarkGfm, keepRawHtmlAsText]} components={components}>{text}</Markdown>
    </div>
  );
}
