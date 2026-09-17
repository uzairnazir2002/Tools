import type { Diagnostic, ToolOptions } from "@formatbase/tool-core";
import { duplicateKeys, fromJson, MAX_CONVERSION_OUTPUT, toJson, type Value } from "./canonical.ts";
import { fromYaml, toYaml } from "./yaml.ts";
import { fromCsv, toCsv } from "./csv.ts";
import { fromXml, toXml } from "./xml.ts";

type Result = { ok: boolean; output: string; diagnostics: Diagnostic[] };
const ids = new Set(["json-to-yaml", "yaml-to-json", "json-to-xml", "xml-to-json", "json-to-csv", "csv-to-json"]);

function collapseDuplicates(value: Value): Value {
  if (value.kind === "array") return { kind: "array", items: value.items.map(collapseDuplicates) };
  if (value.kind !== "object") return value;
  const last = new Map<string, Value>();
  for (const [key, child] of value.entries) last.set(key, collapseDuplicates(child));
  return { kind: "object", entries: [...last] };
}

export function runConversion(tool: string, input: string, options: ToolOptions = {}): Result {
  if (!ids.has(tool)) return { ok: false, output: "", diagnostics: [{ severity: "error", code: "INVALID_CONVERSION", message: "Unknown conversion tool." }] };
  const mode = ["lossless", "best-effort", "compatibility"].includes(String(options.mode)) ? String(options.mode) : "lossless";
  try {
    let value: Value;
    const diagnostics: Diagnostic[] = [];
    if (tool.startsWith("json-to-")) {
      const parsed = fromJson(input);
      value = parsed.value;
      diagnostics.push(...parsed.diagnostics);
      const duplicates = duplicateKeys(value);
      if (duplicates.length) {
        if (mode === "lossless") throw new Error("DUPLICATE_KEY_LOSS: Duplicate JSON keys cannot be represented losslessly.");
        value = collapseDuplicates(value);
        diagnostics.push({ severity: "warning", code: "DUPLICATE_KEY_LOSS", message: "Duplicate JSON keys were collapsed to the last value." });
      }
    } else if (tool === "yaml-to-json") {
      const parsed = fromYaml(input, mode); value = parsed.value; diagnostics.push(...parsed.diagnostics);
    } else if (tool === "xml-to-json") {
      const parsed = fromXml(input, mode); value = parsed.value; diagnostics.push(...parsed.diagnostics);
    } else {
      const parsed = fromCsv(input, mode); value = parsed.value; diagnostics.push(...parsed.diagnostics);
    }
    let output: string;
    if (tool.endsWith("-to-json")) output = toJson(value);
    else if (tool.endsWith("-to-yaml")) {
      const converted = toYaml(value, mode); output = converted.output; diagnostics.push(...converted.diagnostics);
    } else if (tool.endsWith("-to-xml")) {
      const converted = toXml(value, mode); output = converted.output; diagnostics.push(...converted.diagnostics);
    } else {
      const converted = toCsv(value, mode); output = converted.output; diagnostics.push(...converted.diagnostics);
    }
    if (output.length > MAX_CONVERSION_OUTPUT) throw new Error("OUTPUT_LIMIT: Converted result is too large.");
    return { ok: true, output, diagnostics };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Conversion failed";
    const match = /^([A-Z][A-Z_]+):\s*(.*)$/.exec(raw);
    return { ok: false, output: "", diagnostics: [{ severity: "error", code: match?.[1] ?? "CONVERSION_ERROR", message: (match?.[2] ?? raw).slice(0, 300), suggestion: "Check the source format and conversion mode." }] };
  }
}
