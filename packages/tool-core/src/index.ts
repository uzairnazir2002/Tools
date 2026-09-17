export type ToolId = string;
export const MAX_EDITOR_INPUT_BYTES = 3 * 1024 * 1024;
export type Action = string;
export type EngineId = "json" | "sql" | "yaml" | "xml" | "csv" | "conversion";
export type EditorLanguage = "json" | "sql" | "yaml" | "xml" | "csv" | "text";
export type OptionValue = string | number | boolean;
export type ToolOptions = Record<string, OptionValue>;
export type Diagnostic = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  line?: number;
  column?: number;
  startOffset?: number;
  endOffset?: number;
  suggestion?: string;
  fix?: { label: string; startOffset: number; endOffset: number; replacement: string };
};
export type WorkerRequest = {
  requestId: string;
  tool: ToolId;
  engine: EngineId;
  action: Action;
  input: string;
  options: ToolOptions;
};
export type WorkerResponse = {
  requestId: string;
  ok: boolean;
  output: string;
  diagnostics: Diagnostic[];
  metrics: { durationMs: number; inputBytes: number; outputBytes: number };
};
