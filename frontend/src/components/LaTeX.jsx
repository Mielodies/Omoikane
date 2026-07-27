import { useMemo } from 'react';

function renderLatex(text) {
  if (!text) return '';
  if (typeof window === 'undefined' || !window.katex) return text;
  return text
    .replace(/\$\$([^$]+)\$\$/g, (_, math) => {
      try {
        return window.katex.renderToString(math, { displayMode: true, throwOnError: false });
      } catch { return math; }
    })
    .replace(/\$([^$]+)\$/g, (_, math) => {
      try {
        return window.katex.renderToString(math, { displayMode: false, throwOnError: false });
      } catch { return math; }
    });
}

export default function LaTeX({ text, className }) {
  const html = useMemo(() => renderLatex(text), [text]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
