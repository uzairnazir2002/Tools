"use client";
import type { Diagnostic } from "@formatbase/tool-core";

function excerpt(source: string, offset: number) {
  const lineStart = source.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const nextLine = source.indexOf("\n", offset);
  const lineEnd = nextLine === -1 ? source.length : nextLine;
  const visibleStart = Math.max(lineStart, offset - 60);
  const visibleEnd = Math.min(lineEnd, offset + 80);
  const text = `${visibleStart > lineStart ? "…" : ""}${source.slice(visibleStart, visibleEnd)}${visibleEnd < lineEnd ? "…" : ""}`;
  const caret = Math.max(0, offset - visibleStart) + (visibleStart > lineStart ? 1 : 0);
  return { text, caret };
}

export function DiagnosticPanel({ source, diagnostics, onFix }: { source: string; diagnostics: Diagnostic[]; onFix: (fix: NonNullable<Diagnostic["fix"]>) => void }) {
  if (!diagnostics.length) return null;
  return <div className="diagnostics" aria-label="Diagnostics">{diagnostics.map((diagnostic, index) => {
    const context = diagnostic.startOffset === undefined ? null : excerpt(source, diagnostic.startOffset);
    return <div className={`diagnostic ${diagnostic.severity}`} key={`${diagnostic.code}-${index}`}>
      <div className="diagnostic-heading"><strong>{diagnostic.severity === "error" ? "Error" : diagnostic.severity === "warning" ? "Warning" : "Info"}</strong><span>{diagnostic.message}{diagnostic.line ? ` — line ${diagnostic.line}${diagnostic.column ? `, column ${diagnostic.column}` : ""}` : ""}</span></div>
      {context && <pre className="diagnostic-excerpt"><code>{context.text}{"\n"}{" ".repeat(context.caret)}^</code></pre>}
      {diagnostic.suggestion && <p>{diagnostic.suggestion}</p>}
      {diagnostic.fix && <button className="diagnostic-fix" type="button" onClick={() => onFix(diagnostic.fix!)}>{diagnostic.fix.label}</button>}
    </div>;
  })}</div>;
}
