import type { Action, ToolId } from "@formatbase/tool-core";

export type ToolExecutionEvent = {
  name: "tool_execution";
  tool: ToolId;
  action: Action;
  success: boolean;
  inputSize: "under_10kb" | "10kb_to_100kb" | "100kb_to_1mb" | "over_1mb";
  durationMs: number;
};

export function inputSizeBucket(bytes: number): ToolExecutionEvent["inputSize"] {
  if (bytes < 10_000) return "under_10kb";
  if (bytes < 100_000) return "10kb_to_100kb";
  if (bytes < 1_000_000) return "100kb_to_1mb";
  return "over_1mb";
}

export interface AnalyticsProvider { track(event: ToolExecutionEvent): void; }
let provider: AnalyticsProvider = { track: () => {} };
export function setAnalyticsProvider(next: AnalyticsProvider): void { provider = next; }
export function track(event: ToolExecutionEvent): void { provider.track(event); }
