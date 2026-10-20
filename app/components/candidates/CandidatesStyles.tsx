import type { ReactNode } from "react";

export type Tone = "violet" | "green" | "blue" | "amber" | "red" | "gray";

export function CandidatesStyles() {
  return (
    <style>{`
      .cd-tag {
        display: inline-block; white-space: nowrap; border-radius: 9999px;
        border: 1px solid; padding: 3px 10px; font-size: 11px; font-weight: 700;
      }
      .cd-tag-sm { padding: 1px 7px; font-size: 10px; }
      .cd-tag-violet { background: rgba(124,58,237,.12); border-color: rgba(124,58,237,.4); color: #6d28d9; }
      .cd-tag-green  { background: rgba(34,197,94,.14);  border-color: rgba(34,197,94,.45);  color: #15803d; }
      .cd-tag-blue   { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.4);  color: #1d4ed8; }
      .cd-tag-amber  { background: rgba(245,158,11,.16); border-color: rgba(245,158,11,.45); color: #b45309; }
      .cd-tag-red    { background: rgba(239,68,68,.12);  border-color: rgba(239,68,68,.4);   color: #b91c1c; }
      .cd-tag-gray   { background: rgba(113,113,122,.12); border-color: rgba(113,113,122,.35); color: #52525b; }
      html[data-theme="dark"] .cd-tag-violet { background: rgba(124,58,237,.18); border-color: rgba(124,58,237,.5); color: #c4b5fd; }
      html[data-theme="dark"] .cd-tag-green  { background: rgba(34,197,94,.16);  border-color: rgba(34,197,94,.45);  color: #86efac; }
      html[data-theme="dark"] .cd-tag-blue   { background: rgba(59,130,246,.16); border-color: rgba(59,130,246,.45); color: #93c5fd; }
      html[data-theme="dark"] .cd-tag-amber  { background: rgba(245,158,11,.16); border-color: rgba(245,158,11,.45); color: #fcd34d; }
      html[data-theme="dark"] .cd-tag-red    { background: rgba(239,68,68,.16);  border-color: rgba(239,68,68,.45);  color: #fca5a5; }
      html[data-theme="dark"] .cd-tag-gray   { background: rgba(161,161,170,.12); border-color: rgba(161,161,170,.3); color: #d4d4d8; }
      .cd-aging { color: #d97706; font-weight: 700; }
      html[data-theme="dark"] .cd-aging { color: #fbbf24; }
      .cd-sal { font-weight: 700; }
      .cd-sal-ok { color: #15803d; }
      .cd-sal-negotiable { color: #b45309; }
      .cd-sal-over { color: #b91c1c; }
      html[data-theme="dark"] .cd-sal-ok { color: #86efac; }
      html[data-theme="dark"] .cd-sal-negotiable { color: #fcd34d; }
      html[data-theme="dark"] .cd-sal-over { color: #fca5a5; }
      .cd-pill {
        display: inline-block; border: 1px solid var(--app-border); border-radius: 9999px;
        background: var(--app-surface-muted); padding: 3px 9px; font-size: 11px;
        color: var(--app-text-secondary); white-space: nowrap;
      }
      .cd-pill:hover { border-color: #8b5cf6; color: var(--app-text-primary); }
      .cd-mark { background: rgba(250,204,21,.35); color: inherit; border-radius: 3px; padding: 0 1px; }
    `}</style>
  );
}

export function Tag({
  tone,
  small = false,
  title,
  children,
}: {
  tone: Tone;
  small?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span title={title} className={`cd-tag cd-tag-${tone} ${small ? "cd-tag-sm" : ""}`}>
      {children}
    </span>
  );
}

/** Texto con la palabra buscada resaltada. */
export function Highlight({ text, term }: { text: string; term: string }) {
  const clean = term.trim();

  if (!clean) {
    return <>{text}</>;
  }

  const lower = text.toLowerCase();
  const needle = clean.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let at = lower.indexOf(needle, cursor);

  while (at >= 0) {
    if (at > cursor) {
      parts.push(text.slice(cursor, at));
    }

    parts.push(
      <mark key={at} className="cd-mark">
        {text.slice(at, at + needle.length)}
      </mark>
    );

    cursor = at + needle.length;
    at = lower.indexOf(needle, cursor);
  }

  parts.push(text.slice(cursor));

  return <>{parts}</>;
}
