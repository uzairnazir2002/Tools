import { parse, type DocumentNode, type ValueNode } from "@humanwhocodes/momoa";
import type { Action, Diagnostic, ToolOptions } from "@codeformattools/tool-core";

type Result = { ok: boolean; output: string; diagnostics: Diagnostic[] };
const MAX_DEPTH = 512;
const MAX_FORMATTED_CHARS = 12 * 1024 * 1024;

function position(source: string, offset: number) {
  const before = source.slice(0, offset);
  const lines = before.split(/\r\n|\r|\n/);
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function depthDiagnostic(source: string): Diagnostic | undefined {
  let depth = 0, inString = false, escaped = false;
  for (let offset = 0; offset < source.length; offset++) {
    const char = source[offset];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{" || char === "[") {
      if (++depth > MAX_DEPTH) return { severity: "error", code: "DEPTH_LIMIT", message: `JSON nesting exceeds the ${MAX_DEPTH}-level safety limit.`, startOffset: offset, endOffset: offset + 1, ...position(source, offset), suggestion: "Reduce the nesting depth before processing." };
    } else if (char === "}" || char === "]") depth--;
  }
}

function sourceOf(source: string, node: { range?: [number, number] }): string {
  if (!node.range) throw new Error("Source range unavailable");
  return source.slice(node.range[0], node.range[1]);
}

function duplicateWarnings(node: ValueNode, warnings: Diagnostic[]): void {
  if (node.type === "Object") {
    const seen = new Set<string>();
    for (const member of node.members) {
      const key = member.name.type === "String" ? member.name.value : member.name.name;
      if (seen.has(key)) warnings.push({
        severity: "warning", code: "DUPLICATE_KEY", message: `Duplicate key "${key}". Some JSON readers keep only the last value.`,
        line: member.name.loc.start.line, column: member.name.loc.start.column,
        startOffset: member.name.loc.start.offset, endOffset: member.name.loc.end.offset,
        suggestion: "Rename or remove the duplicate key if this was unintentional."
      });
      seen.add(key);
      duplicateWarnings(member.value, warnings);
    }
  } else if (node.type === "Array") for (const element of node.elements) duplicateWarnings(element.value, warnings);
}

function render(source: string, node: ValueNode, depth: number, indentation: string, sort: boolean): string {
  if (node.type === "Object") {
    if (node.members.length === 0) return "{}";
    const members = sort ? [...node.members].sort((a, b) => {
      const left = a.name.type === "String" ? a.name.value : a.name.name;
      const right = b.name.type === "String" ? b.name.value : b.name.name;
      return left < right ? -1 : left > right ? 1 : 0;
    }) : node.members;
    if (!indentation) return `{${members.map(member => `${sourceOf(source, member.name)}:${render(source, member.value, depth + 1, indentation, sort)}`).join(",")}}`;
    const pad = indentation.repeat(depth + 1);
    return `{\n${members.map(member => `${pad}${sourceOf(source, member.name)}: ${render(source, member.value, depth + 1, indentation, sort)}`).join(",\n")}\n${indentation.repeat(depth)}}`;
  }
  if (node.type === "Array") {
    if (node.elements.length === 0) return "[]";
    if (!indentation) return `[${node.elements.map(element => render(source, element.value, depth + 1, indentation, sort)).join(",")}]`;
    const pad = indentation.repeat(depth + 1);
    return `[\n${node.elements.map(element => `${pad}${render(source, element.value, depth + 1, indentation, sort)}`).join(",\n")}\n${indentation.repeat(depth)}]`;
  }
  return sourceOf(source, node);
}

function estimatedSize(source: string, node: ValueNode, depth: number, indentLength: number): number {
  if (node.type === "Object") {
    if (!node.members.length) return 2;
    let size = 2 + (indentLength ? depth * indentLength + 2 : 0);
    for (const member of node.members) {
      size += sourceOf(source, member.name).length + (indentLength ? (depth + 1) * indentLength + 2 : 1);
      size += estimatedSize(source, member.value, depth + 1, indentLength);
      size += indentLength ? 2 : 1;
      if (size > MAX_FORMATTED_CHARS) return size;
    }
    return size;
  }
  if (node.type === "Array") {
    if (!node.elements.length) return 2;
    let size = 2 + (indentLength ? depth * indentLength + 2 : 0);
    for (const element of node.elements) {
      size += (indentLength ? (depth + 1) * indentLength : 0) + estimatedSize(source, element.value, depth + 1, indentLength);
      size += indentLength ? 2 : 1;
      if (size > MAX_FORMATTED_CHARS) return size;
    }
    return size;
  }
  return sourceOf(source, node).length;
}

function syntaxDiagnostic(source: string, error: unknown): Diagnostic {
  const e = error as Error & { line?: number; column?: number; offset?: number };
  const message = e instanceof Error ? e.message.replace(/ \(\d+:\d+\)$/, "") : "Invalid JSON";
  const offset = e.offset;
  const char = offset === undefined ? "" : source[offset];
  let code = "INVALID_JSON", explanation = message, suggestion: string | undefined;
  let fix: Diagnostic["fix"];
  if (offset !== undefined && (char === "}" || char === "]")) {
    let previous = offset - 1;
    while (previous >= 0 && /\s/.test(source[previous])) previous--;
    if (source[previous] === ",") {
      code = "TRAILING_COMMA"; explanation = "Unexpected trailing comma"; suggestion = "Remove the comma before the closing bracket.";
      fix = { label: "Remove trailing comma", startOffset: previous, endOffset: previous + 1, replacement: "" };
    }
  }
  if (code === "INVALID_JSON" && char === "'") { code = "SINGLE_QUOTES"; explanation = "Single quotes are not valid JSON string delimiters"; suggestion = "Use double quotes for property names and string values."; }
  if (code === "INVALID_JSON" && offset !== undefined && (char === "\\" || source[offset - 1] === "\\")) { code = "BAD_ESCAPE"; explanation = "Invalid escape sequence in a JSON string"; suggestion = "Use a supported escape such as \\n, \\t, \\uXXXX, or \\\\."; }
  if (code === "INVALID_JSON" && message.includes("end of input")) { code = "UNEXPECTED_END"; explanation = "JSON ended before the structure was complete"; suggestion = "Check for a missing closing brace, bracket, or quote."; }
  if (code === "INVALID_JSON" && message.includes("Unexpected token String")) { code = "MISSING_COMMA"; explanation = "Expected a comma before this string"; suggestion = "Separate object properties or array items with a comma."; }
  return {
    severity: "error", code, message: explanation,
    line: e.line, column: e.column, startOffset: offset,
    endOffset: offset === undefined ? undefined : offset + 1,
    suggestion, fix
  };
}

export function runJson(input: string, action: Action, options: ToolOptions): Result {
  const tooDeep = depthDiagnostic(input);
  if (tooDeep) return { ok: false, output: "", diagnostics: [tooDeep] };
  try {
    const ast: DocumentNode = parse(input, { mode: "json", ranges: true });
    const diagnostics: Diagnostic[] = [];
    duplicateWarnings(ast.body, diagnostics);
    const indentation = action === "minify" ? "" : options.indentation === "tab" ? "\t" : " ".repeat(options.indentation === 4 ? 4 : 2);
    if (action !== "validate" && estimatedSize(input, ast.body, 0, indentation.length) > MAX_FORMATTED_CHARS) {
      return { ok: false, output: "", diagnostics: [{ severity: "error", code: "OUTPUT_TOO_LARGE", message: "The formatted result would exceed the 12 million character safety limit.", suggestion: "Use a smaller input or minify this document." }] };
    }
    const output = action === "validate" ? "" : render(input, ast.body, 0, indentation, action === "sort");
    return { ok: true, output, diagnostics };
  } catch (error) { return { ok: false, output: "", diagnostics: [syntaxDiagnostic(input, error)] }; }
}
