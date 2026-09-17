import { parseCsv, writeCsv } from "@formatbase/csv-engine";
import type { Diagnostic } from "@formatbase/tool-core";
import { toJson, type Value } from "./canonical.ts";

const warning = (code: string, message: string): Diagnostic => ({ severity: "warning", code, message });

export function fromCsv(input: string, mode: string): { value: Value; diagnostics: Diagnostic[] } {
  const table = parseCsv(input);
  const diagnostics = [...table.diagnostics];
  const cell = (text: string): Value => {
    if (mode === "lossless" || mode === "compatibility") return { kind: "string", value: text };
    if (text === "true" || text === "false") return { kind: "boolean", value: text === "true" };
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text)) return { kind: "number", text };
    return { kind: "string", value: text };
  };
  if (mode === "best-effort") diagnostics.push(warning("CSV_TYPE_INFERENCE", "Numeric and boolean cells were inferred; quoted CSV text can be ambiguous."));
  return { value: { kind: "array", items: table.rows.map(row => ({ kind: "object", entries: table.headers.map((header, index) => [header, cell(row[index])]) })) }, diagnostics };
}

export function toCsv(value: Value, mode: string): { output: string; diagnostics: Diagnostic[] } {
  if (value.kind !== "array" || value.items.some(item => item.kind !== "object")) throw new Error("CSV_SHAPE_ERROR: JSON must be an array of objects.");
  const objects = value.items as Extract<Value, { kind: "object" }>[];
  if (!objects.length) throw new Error("CSV_SHAPE_ERROR: Add at least one object so CSV headers can be determined.");
  const headers = [...new Set(objects.flatMap(item => item.entries.map(([key]) => key)))];
  const warnings: Diagnostic[] = [];
  const rows = objects.map(object => {
    const entries = new Map(object.entries);
    if (entries.size !== object.entries.length) throw new Error("CSV_DUPLICATE_KEY: Duplicate JSON keys cannot become CSV columns.");
    return headers.map(header => {
      if (!entries.has(header)) {
        if (mode === "lossless") throw new Error("CSV_MISSING_VALUE: Missing columns cannot be represented losslessly.");
        warnings.push(warning("CSV_MISSING_VALUE", "Missing object keys became empty cells."));
        return "";
      }
      const cell = entries.get(header)!;
      if (cell.kind === "string") return cell.value;
      if (mode === "lossless") throw new Error("CSV_TYPE_LOSS: CSV has no native number, boolean, null, array, or object type.");
      if (cell.kind === "number") return cell.text;
      if (cell.kind === "boolean") return String(cell.value);
      if (cell.kind === "null") { warnings.push(warning("CSV_NULL_LOSS", "Null values became empty cells.")); return ""; }
      if (mode !== "compatibility") throw new Error("CSV_NESTED_VALUE: Choose Compatibility mode to serialize nested data into cells.");
      warnings.push(warning("CSV_NESTED_STRINGIFIED", "Nested values became JSON strings inside CSV cells."));
      return toJson(cell, 0);
    });
  });
  const result = writeCsv(headers, rows);
  if (mode === "lossless" && result.diagnostics.length) throw new Error("CSV_FORMULA_LOSS: Formula-like strings require an escape prefix in downloadable CSV.");
  if (mode !== "lossless") warnings.push(warning("CSV_TYPE_LOSS", "CSV stores cell text, so source JSON types may not round-trip."));
  return { output: result.output, diagnostics: [...new Map([...warnings, ...result.diagnostics].map(item => [item.code, item])).values()] };
}
