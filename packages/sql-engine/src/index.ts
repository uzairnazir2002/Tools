import { format, type KeywordCase, type SqlLanguage } from "sql-formatter";
import type { Diagnostic, ToolOptions } from "@formatbase/tool-core";

const dialects: SqlLanguage[] = ["sql", "postgresql", "mysql", "mariadb", "transactsql", "sqlite", "bigquery", "snowflake", "plsql", "redshift", "duckdb", "clickhouse"];
type Result = { ok: boolean; output: string; diagnostics: Diagnostic[] };

function location(source: string, line: number, column: number): number {
  let offset = 0, current = 1;
  while (current < line && offset < source.length) if (source[offset++] === "\n") current++;
  return Math.min(source.length, offset + column - 1);
}

export function runSql(input: string, options: ToolOptions): Result {
  const rawDialect = String(options.dialect ?? "sql");
  const dialect = dialects.find(item => item === rawDialect) ?? "sql";
  const indentation = options.indentation === "tab" ? "tab" : options.indentation === 4 ? 4 : 2;
  const rawCase = String(options.keywordCase ?? "upper");
  const keywordCase: KeywordCase = rawCase === "lower" || rawCase === "preserve" ? rawCase : "upper";
  const linesBetweenQueries = options.linesBetweenQueries === 2 || options.linesBetweenQueries === 3 ? options.linesBetweenQueries : 1;
  try {
    return { ok: true, output: format(input, { language: dialect, tabWidth: indentation === "tab" ? 2 : indentation, useTabs: indentation === "tab", keywordCase, linesBetweenQueries }), diagnostics: [] };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "SQL could not be formatted";
    const match = raw.match(/at line (\d+) column (\d+)/);
    const line = match ? Number(match[1]) : undefined;
    const column = match ? Number(match[2]) : undefined;
    const startOffset = line && column ? location(input, line, column) : undefined;
    return { ok: false, output: "", diagnostics: [{ severity: "error", code: "SQL_PARSE_ERROR", message: raw.split("\n")[0], line, column, startOffset, endOffset: startOffset === undefined ? undefined : startOffset + 1, suggestion: "Check the selected SQL dialect and the syntax near this location." }] };
  }
}
