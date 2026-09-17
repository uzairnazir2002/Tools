import { COLLECTION_STYLE_BLOCK, CORE_SCHEMA, eventsToAst, loadAll, mergeTag, parseEvents, present, visit, YAMLException } from "js-yaml";
import type { Diagnostic, ToolOptions } from "@formatbase/tool-core";

export const YAML_LIMITS = { depth: 64, aliases: 32, totalMergeKeys: 2_000, nodes: 100_000, documents: 20, lineCharacters: 1_000_000, outputCharacters: 12_000_000 } as const;
type Result = { ok: boolean; output: string; diagnostics: Diagnostic[] };
const schema = CORE_SCHEMA.withTags(mergeTag);

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return true;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function guardNodes(documents: unknown[]) {
  let count = 0;
  const stack = documents.filter(isContainer);
  while (stack.length) {
    const node = stack.pop()!;
    for (const key in node) {
      if (++count > YAML_LIMITS.nodes) throw new Error("YAML_NODE_LIMIT");
      const value = (node as Record<string, unknown>)[key];
      if (isContainer(value)) stack.push(value);
    }
  }
}

function failure(error: unknown): Result {
  if (error instanceof YAMLException) {
    const offset = error.mark?.position;
    return { ok: false, output: "", diagnostics: [{ severity: "error", code: "YAML_PARSE_ERROR", message: error.reason, line: error.mark ? error.mark.line + 1 : undefined, column: error.mark ? error.mark.column + 1 : undefined, startOffset: offset, endOffset: offset === undefined ? undefined : offset + 1, suggestion: "Check indentation, aliases, merge keys, or syntax near this location." }] };
  }
  const message = error instanceof Error ? error.message : "YAML could not be processed";
  const safety = /maxDepth|maxAliases|maxTotalMergeKeys|YAML_NODE_LIMIT/i.test(message);
  return { ok: false, output: "", diagnostics: [{ severity: "error", code: safety ? "YAML_SAFETY_LIMIT" : "YAML_ERROR", message: message === "YAML_NODE_LIMIT" ? `YAML exceeds the ${YAML_LIMITS.nodes.toLocaleString()} node safety limit.` : message.slice(0, 240) }] };
}

export function runYaml(input: string, action: string, options: ToolOptions = {}): Result {
  if (action !== "format" && action !== "validate") return { ok: false, output: "", diagnostics: [{ severity: "error", code: "INVALID_ACTION", message: "Unknown YAML operation." }] };
  let lineStart = 0;
  for (let index = 0; index <= input.length; index++) {
    if (index !== input.length && input[index] !== "\n") continue;
    if (index - lineStart > YAML_LIMITS.lineCharacters) return { ok: false, output: "", diagnostics: [{ severity: "error", code: "YAML_LINE_LIMIT", message: "A YAML line exceeds the 1,000,000 character safety limit.", startOffset: lineStart, endOffset: lineStart + 1 }] };
    lineStart = index + 1;
  }
  try {
    const documents = loadAll(input, { schema, maxDepth: YAML_LIMITS.depth, maxAliases: YAML_LIMITS.aliases, maxTotalMergeKeys: YAML_LIMITS.totalMergeKeys });
    if (documents.length > YAML_LIMITS.documents) return { ok: false, output: "", diagnostics: [{ severity: "error", code: "YAML_DOCUMENT_LIMIT", message: `YAML streams are limited to ${YAML_LIMITS.documents} documents.` }] };
    guardNodes(documents);
    if (action === "validate") return { ok: true, output: "", diagnostics: [] };
    const indentation = options.indentation === 4 ? 4 : 2;
    const syntax = eventsToAst(parseEvents(input, { maxDepth: YAML_LIMITS.depth }), { source: input, schema });
    visit(syntax, node => { if (node.kind === "mapping" || node.kind === "sequence") node.style = COLLECTION_STYLE_BLOCK; });
    const output = present(syntax, { schema, indent: indentation, lineWidth: -1 }).trimEnd();
    if (output.length > YAML_LIMITS.outputCharacters) return { ok: false, output: "", diagnostics: [{ severity: "error", code: "YAML_OUTPUT_LIMIT", message: "Formatted YAML would exceed the output safety limit." }] };
    const diagnostics: Diagnostic[] = input.includes("#") ? [{ severity: "warning", code: "YAML_COMMENTS_REMOVED", message: "Comments may be removed by formatting. Review the output before replacing the source." }] : [];
    return { ok: true, output, diagnostics };
  } catch (error) { return failure(error); }
}
