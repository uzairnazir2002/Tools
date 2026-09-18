"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Tool } from "@codeformattools/tool-registry";
import { MAX_EDITOR_INPUT_BYTES, type Diagnostic, type ToolOptions, type WorkerRequest, type WorkerResponse } from "@codeformattools/tool-core";
import { inputSizeBucket, track } from "@codeformattools/analytics";
import { CodeEditor } from "@codeformattools/editor";
import { migratedStorageValue, setStorageValue } from "@/lib/browser-storage";
import { downloadMime } from "@/lib/download-mime";
import { DiagnosticPanel } from "./diagnostic-panel";

const AUTO_LIMIT_BYTES = 1 * 1024 * 1024;
const SMALL_INPUT_BYTES = 100 * 1024;
const MAX_PROCESSING_MS = 20_000;
const encoder = new TextEncoder();
type Status = "idle" | "working" | "guarded" | "success" | "error";

function defaults(tool: Tool): ToolOptions {
  return Object.fromEntries(tool.options.map(option => [option.id, option.defaultValue]));
}

export function ToolShell({ tool }: { tool: Tool }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [options, setOptions] = useState<ToolOptions>(() => defaults(tool));
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState<WorkerResponse["metrics"] | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const requestRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const clearProcessingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);
  const stopWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    clearProcessingTimeout();
  }, [clearProcessingTimeout]);
  const workerError = useCallback((inputSize?: ReturnType<typeof inputSizeBucket>) => {
    stopWorker();
    setStatus("error");
    setDiagnostics([{ severity: "error", code: "WORKER_ERROR", message: "The browser worker could not process this input. Try again or use a smaller input." }]);
    track({ name: "tool_error", tool: tool.id, action: tool.action, code: "worker_error", inputSize });
  }, [stopWorker, tool]);
  const getWorker = useCallback((inputSize?: ReturnType<typeof inputSizeBucket>) => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL("../workers/tool.worker.ts", import.meta.url));
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.requestId !== String(requestRef.current)) return;
      clearProcessingTimeout();
      setOutput(event.data.output); setDiagnostics(event.data.diagnostics); setMetrics(event.data.metrics);
      setStatus(event.data.ok ? "success" : "error");
      track({ name: "tool_execution", tool: tool.id, action: tool.action, success: event.data.ok, inputSize: inputSizeBucket(event.data.metrics.inputBytes), durationMs: event.data.metrics.durationMs });
    };
    worker.onerror = () => {
      if (!workerRef.current) return;
      workerError(inputSize);
    };
    workerRef.current = worker;
    return worker;
  }, [clearProcessingTimeout, tool, workerError]);
  const stopAutoTimer = useCallback(() => {
    if (autoTimerRef.current !== null) window.clearTimeout(autoTimerRef.current);
    autoTimerRef.current = null;
  }, []);

  useEffect(() => {
    const values = defaults(tool);
    for (const option of tool.options) {
      const saved = migratedStorageValue(`option.${tool.id}.${option.id}`, value => Boolean(option.choices?.some(item => String(item.value) === value)) || (option.type === "checkbox" && (value === "true" || value === "false")));
      const choice = option.choices?.find(item => String(item.value) === saved);
      if (choice) values[option.id] = choice.value;
      if (option.type === "checkbox" && (saved === "true" || saved === "false")) values[option.id] = saved === "true";
    }
    // Restore safe, primitive preferences after server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOptions(values);
    setPreferencesReady(true);
  }, [tool]);
  useEffect(() => {
    if (!preferencesReady) return;
    for (const option of tool.options) setStorageValue(`option.${tool.id}.${option.id}`, String(options[option.id] ?? option.defaultValue));
  }, [options, preferencesReady, tool]);
  useEffect(() => () => { stopWorker(); stopAutoTimer(); }, [stopWorker, stopAutoTimer]);

  const processInput = useCallback((source: string) => {
    stopAutoTimer();
    clearProcessingTimeout();
    const requestId = String(++requestRef.current);
    setCopied(false);
    if (!source.trim()) { setOutput(""); setDiagnostics([]); setStatus("idle"); setMetrics(null); return; }
    const inputBytes = encoder.encode(source).length;
    const inputSize = inputSizeBucket(inputBytes);
    if (inputBytes > MAX_EDITOR_INPUT_BYTES) {
      setOutput(""); setStatus("error"); setMetrics(null);
      setDiagnostics([{ severity: "error", code: "INPUT_TOO_LARGE", message: "This editor currently supports files up to 3 MB. Try a smaller file." }]);
      track({ name: "tool_error", tool: tool.id, action: tool.action, code: "input_too_large", inputSize });
      return;
    }
    setStatus("working");
    track({ name: "tool_start", tool: tool.id, action: tool.action, inputSize });
    const worker = getWorker(inputSize);
    timeoutRef.current = window.setTimeout(() => {
      if (requestId !== String(requestRef.current)) return;
      stopWorker();
      setStatus("error");
      setDiagnostics([{ severity: "error", code: "PROCESSING_TIMEOUT", message: "Processing took too long. Try a smaller input." }]);
      track({ name: "tool_error", tool: tool.id, action: tool.action, code: "processing_timeout", inputSize });
    }, MAX_PROCESSING_MS);
    const request: WorkerRequest = { requestId, tool: tool.id, engine: tool.engine, action: tool.action, input: source, options };
    try { worker.postMessage(request); }
    catch { workerError(inputSize); }
  }, [clearProcessingTimeout, getWorker, options, stopAutoTimer, stopWorker, tool, workerError]);

  useEffect(() => {
    if (!input.trim() || !preferencesReady) return;
    const size = encoder.encode(input).length;
    if (size > AUTO_LIMIT_BYTES) return;
    const timer = window.setTimeout(() => processInput(input), size <= SMALL_INPUT_BYTES ? 450 : 900);
    autoTimerRef.current = timer;
    return () => { window.clearTimeout(timer); if (autoTimerRef.current === timer) autoTimerRef.current = null; };
  }, [input, preferencesReady, processInput]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && input.trim()) { event.preventDefault(); processInput(input); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [input, processInput]);

  const onInput = (text: string) => {
    ++requestRef.current;
    clearProcessingTimeout(); stopAutoTimer();
    setInput(text); setOutput(""); setMetrics(null); setDiagnostics([]);
    setStatus(!text.trim() ? "idle" : encoder.encode(text).length > AUTO_LIMIT_BYTES ? "guarded" : "working");
  };
  const onFile = async (file?: File) => {
    if (!file) return;
    const selectionId = ++requestRef.current;
    clearProcessingTimeout(); stopAutoTimer();
    if (file.size > MAX_EDITOR_INPUT_BYTES) {
      setOutput(""); setMetrics(null); setStatus("error");
      setDiagnostics([{ severity: "error", code: "INPUT_TOO_LARGE", message: "Choose a file smaller than 3 MB." }]);
      return;
    }
    const text = await file.text();
    if (selectionId === requestRef.current) onInput(text);
  };
  const updateOption = (id: string, value: string | number | boolean) => {
    ++requestRef.current; clearProcessingTimeout(); stopAutoTimer(); setOutput(""); setMetrics(null); setDiagnostics([]);
    setStatus(!input.trim() ? "idle" : encoder.encode(input).length > AUTO_LIMIT_BYTES ? "guarded" : "working");
    setStorageValue(`option.${tool.id}.${id}`, String(value));
    setOptions(current => ({ ...current, [id]: value }));
  };
  const copy = async () => {
    if (!output) return;
    try { await navigator.clipboard.writeText(output); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { setDiagnostics([{ severity: "error", code: "COPY_FAILED", message: "Clipboard access was denied. Select and copy the result manually." }]); }
  };
  const download = () => {
    if (!output) return;
    const url = URL.createObjectURL(new Blob([output], { type: downloadMime(tool.output.language) }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${tool.slug}${tool.output.extension}`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const reset = () => {
    ++requestRef.current; clearProcessingTimeout(); stopAutoTimer(); setInput(""); setOutput(""); setDiagnostics([]); setStatus("idle"); setMetrics(null);
    if (fileRef.current) fileRef.current.value = "";
  };
  const applyFix = (fix: NonNullable<Diagnostic["fix"]>) => onInput(`${input.slice(0, fix.startOffset)}${fix.replacement}${input.slice(fix.endOffset)}`);
  const visibleOptions = tool.options.filter(option => !option.actions || option.actions.includes(tool.action));
  const statusText = status === "idle" ? "Ready when you are" : status === "guarded" ? "Large input — run manually" : status === "working" ? "Processing in your browser…" : status === "error" ? "Needs attention" : diagnostics.some(d => d.severity === "warning") ? "Completed with warnings" : tool.action === "validate" ? "Valid input" : "Done — processed locally";

  return <section className="tool-workspace container" aria-label={`${tool.name} application`}>
    <div className="workspace-toolbar"><div className="workspace-label"><span className="workspace-icon">{`{ }`}</span><span>WORKSPACE</span><span className="workspace-sep">/</span><strong>{tool.name}</strong></div><div className="toolbar-options">
      {visibleOptions.map(option => <label className="tool-option" key={option.id} htmlFor={`option-${option.id}`}><span>{option.label}</span>{option.type === "checkbox" ? <input id={`option-${option.id}`} type="checkbox" checked={Boolean(options[option.id])} onChange={e => updateOption(option.id, e.target.checked)} /> : <select id={`option-${option.id}`} value={String(options[option.id] ?? option.defaultValue)} onChange={e => { const chosen = option.choices?.find(choice => String(choice.value) === e.target.value); if (chosen) updateOption(option.id, chosen.value); }}>{option.choices?.map(choice => <option key={String(choice.value)} value={String(choice.value)}>{choice.label}</option>)}</select>}</label>)}
      <button className="text-button" onClick={reset} disabled={!input}>Reset ↺</button>
    </div></div>
    <div className="editor-grid"><div className="editor-pane"><div className="pane-header"><div><span className="pane-dot input-dot" />{tool.inputLabel}</div><div className="pane-actions"><input ref={fileRef} type="file" accept={tool.input.extensions.join(",")} hidden onChange={e => onFile(e.target.files?.[0])} /><button onClick={() => fileRef.current?.click()}>↑ Open file</button></div></div><div className="editor-area"><CodeEditor value={input} language={tool.input.language} onChange={onInput} diagnostics={diagnostics} label={tool.inputLabel} />{!input && <div className="editor-placeholder" aria-hidden="true">Paste or type {tool.input.language.toUpperCase()} here...</div>}</div><div className="pane-footer"><span>{input ? `${encoder.encode(input).length.toLocaleString()} bytes` : "Ready for input"}</span><span>{tool.input.language.toUpperCase()}</span></div></div>
      <div className="editor-pane output-pane"><div className="pane-header"><div><span className="pane-dot output-dot" />{tool.outputLabel}</div><div className="pane-actions"><button disabled={!output} onClick={copy}>{copied ? "✓ Copied" : "▢ Copy"}</button><button disabled={!output} onClick={download}>↓ Download</button></div></div><div className="editor-area"><CodeEditor value={output} language={tool.output.language} readOnly label={tool.outputLabel} />{!output && <div className="output-empty"><span className="empty-symbol">{`{ }`}</span><strong>{status === "success" && tool.action === "validate" ? "Input is valid" : "Your result appears here"}</strong><small>{tool.action === "validate" ? "Validation details appear below" : "Enter data to see the result"}</small></div>}</div><div className="pane-footer"><span>{output ? `${encoder.encode(output).length.toLocaleString()} bytes` : "No output yet"}</span><span>{metrics ? `${metrics.durationMs} ms` : "LOCAL PROCESSING"}</span></div></div></div>
    <div className="workspace-bottom"><button className="button primary run-button" onClick={() => processInput(input)} disabled={!input.trim() || status === "working"}>{status === "working" ? "Processing…" : tool.buttonLabel}<span>↗</span></button><div className={`status-message ${status}`} role="status" aria-live="polite"><span className="status-dot" />{statusText}</div><span className="workspace-privacy">Your input stays in this browser · Ctrl/⌘ + Enter</span></div>
    <DiagnosticPanel source={input} diagnostics={diagnostics} onFix={applyFix} />
  </section>;
}
