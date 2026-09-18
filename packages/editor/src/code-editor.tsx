"use client";
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { Compartment, EditorState } from "@codemirror/state";
import { lintGutter, setDiagnostics, type Diagnostic as CmDiagnostic } from "@codemirror/lint";
import type { Diagnostic, EditorLanguage } from "@codeformattools/tool-core";

type Props = { value: string; language: EditorLanguage; onChange?: (value: string) => void; readOnly?: boolean; diagnostics?: Diagnostic[]; label: string };
async function languageExtension(language: EditorLanguage) {
  switch (language) {
    case "json": return (await import("@codemirror/lang-json")).json();
    case "sql": return (await import("@codemirror/lang-sql")).sql();
    case "yaml": return (await import("@codemirror/lang-yaml")).yaml();
    case "xml": return (await import("@codemirror/lang-xml")).xml();
    default: return [];
  }
}
export function CodeEditor({ value, language, onChange, readOnly = false, diagnostics = [], label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const languageSlot = useRef(new Compartment());
  const initialValue = useRef(value);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!host.current) return;
    const extensions = [basicSetup, languageSlot.current.of([]), EditorView.theme({
      "&": { height: "100%", backgroundColor: "transparent", color: "#d8e4e0", fontSize: "13px" },
      ".cm-content": { padding: "18px 0", fontFamily: "var(--font-mono)", lineHeight: "1.7" },
      ".cm-line": { padding: "0 14px" },
      ".cm-gutters": { backgroundColor: "transparent", color: "#62736f", border: "none", paddingLeft: "8px" },
      ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#ffffff08" },
      ".cm-cursor": { borderLeftColor: "#b3e57c" },
      ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "#5e8c6655" },
      ".cm-tooltip": { backgroundColor: "#18302d", color: "#e6efea", border: "1px solid #38534a" }
    }), EditorView.lineWrapping,
    EditorView.contentAttributes.of({ "aria-label": label }),
    EditorView.updateListener.of(update => { if (update.docChanged) onChangeRef.current?.(update.state.doc.toString()); }),
    EditorState.readOnly.of(readOnly),
    EditorView.editable.of(!readOnly),
    lintGutter()];
    const editor = new EditorView({ state: EditorState.create({ doc: initialValue.current, extensions }), parent: host.current });
    view.current = editor;
    return () => { editor.destroy(); view.current = null; };
  }, [label, readOnly]);

  useEffect(() => {
    let active = true;
    languageExtension(language).then(extension => {
      if (active && view.current) view.current.dispatch({ effects: languageSlot.current.reconfigure(extension) });
    });
    return () => { active = false; };
  }, [language, readOnly]);

  useEffect(() => { const editor = view.current; if (editor && editor.state.doc.toString() !== value) editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } }); }, [value]);
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const marks: CmDiagnostic[] = diagnostics.filter(d => d.startOffset !== undefined).map(d => ({
      from: Math.min(d.startOffset!, editor.state.doc.length),
      to: Math.min(Math.max(d.endOffset ?? d.startOffset! + 1, d.startOffset! + 1), editor.state.doc.length),
      severity: d.severity, message: d.message
    }));
    editor.dispatch(setDiagnostics(editor.state, marks));
  }, [diagnostics, value]);
  return <div className="editor-host" ref={host} aria-label={label} />;
}
