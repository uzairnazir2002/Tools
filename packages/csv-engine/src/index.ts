import Papa from "papaparse";
import type { Diagnostic } from "@codeformattools/tool-core";

export type CsvTable = { headers: string[]; rows: string[][]; diagnostics: Diagnostic[] };
export const CSV_LIMITS = { rows: 100_000, columns: 1_000, outputCharacters: 12_000_000 } as const;

export function parseCsv(input: string): CsvTable {
  const result = Papa.parse<string[]>(input, { header: false, dynamicTyping: false, skipEmptyLines: false, delimiter: "", quoteChar: '"', escapeChar: '"', preview: CSV_LIMITS.rows + 2 });
  if (result.meta.truncated) throw new Error("CSV_ROW_LIMIT: Too many rows.");
  const fatal = result.errors.find(error => error.code !== "UndetectableDelimiter");
  if (fatal) throw new Error(`CSV_PARSE_ERROR: ${fatal.message}`);
  if (/[\r\n]$/.test(input) && result.data.at(-1)?.length === 1 && result.data.at(-1)?.[0] === "") result.data.pop();
  const [headers = [], ...rows] = result.data;
  if (!headers.length || headers.every(value => !value)) throw new Error("CSV_HEADER_REQUIRED: Add a header row.");
  if (headers.length > CSV_LIMITS.columns) throw new Error("CSV_COLUMN_LIMIT: Too many columns.");
  if (rows.length > CSV_LIMITS.rows) throw new Error("CSV_ROW_LIMIT: Too many rows.");
  if (rows.some(row => row.length !== headers.length)) throw new Error("CSV_FIELD_MISMATCH: Every row must match the header width.");
  const seen = new Set<string>();
  for (const header of headers) {
    if (!header) throw new Error("CSV_EMPTY_HEADER: Column names cannot be empty.");
    if (seen.has(header)) throw new Error(`CSV_DUPLICATE_HEADER: Duplicate column ${header}.`);
    seen.add(header);
  }
  return { headers, rows, diagnostics: [] };
}

export function writeCsv(headers: string[], rows: string[][]): { output: string; diagnostics: Diagnostic[] } {
  if (!headers.length || headers.length > CSV_LIMITS.columns || rows.length > CSV_LIMITS.rows) throw new Error("CSV_LIMIT: Table exceeds the CSV safety limit.");
  if (rows.some(row => row.length !== headers.length)) throw new Error("CSV_FIELD_MISMATCH: Every row must match the header width.");
  const unsafeFormula = /^[=+@\t\r]|^-(?!\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$)/;
  const formula = [...headers, ...rows.flat()].some(value => unsafeFormula.test(value));
  const output = Papa.unparse({ fields: headers, data: rows }, { newline: "\n", escapeFormulae: unsafeFormula });
  if (output.length > CSV_LIMITS.outputCharacters) throw new Error("CSV_OUTPUT_LIMIT: CSV output is too large.");
  return { output, diagnostics: formula ? [{ severity: "warning", code: "CSV_FORMULA_ESCAPED", message: "Spreadsheet formula-like cells were prefixed with an apostrophe for safety." }] : [] };
}
