import type { Action, ToolId } from "@codeformattools/tool-core";

export type ToolExecutionEvent = {
  name: "tool_execution";
  tool: ToolId;
  action: Action;
  success: boolean;
  inputSize: "under_10kb" | "10kb_to_100kb" | "100kb_to_1mb" | "over_1mb";
  durationMs: number;
};
export type ToolStartEvent = {
  name: "tool_start";
  tool: ToolId;
  action: Action;
  inputSize: ToolExecutionEvent["inputSize"];
};
export type ToolErrorEvent = {
  name: "tool_error";
  tool: ToolId;
  action: Action;
  code: "input_too_large" | "processing_timeout" | "worker_error";
  inputSize?: ToolExecutionEvent["inputSize"];
};
export type RelatedToolClickEvent = {
  name: "related_tool_click";
  from: ToolId;
  to: ToolId;
};
export type AnalyticsEvent = ToolExecutionEvent | ToolStartEvent | ToolErrorEvent | RelatedToolClickEvent;

export function inputSizeBucket(bytes: number): ToolExecutionEvent["inputSize"] {
  if (bytes < 10_000) return "under_10kb";
  if (bytes < 100_000) return "10kb_to_100kb";
  if (bytes < 1_000_000) return "100kb_to_1mb";
  return "over_1mb";
}

export interface AnalyticsProvider { track(event: AnalyticsEvent): void; }
let provider: AnalyticsProvider = { track: () => {} };
export function setAnalyticsProvider(next: AnalyticsProvider): void { provider = next; }
export function track(event: AnalyticsEvent): void { provider.track(event); }
