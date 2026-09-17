import { parse, type ValueNode } from "@humanwhocodes/momoa";
import { runJson } from "@formatbase/json-engine";
import type { Diagnostic } from "@formatbase/tool-core";

export type Value =
  | { kind: "null" }
  | { kind: "boolean"; value: boolean }
  | { kind: "string"; value: string }
  | { kind: "number"; text: string }
  | { kind: "array"; items: Value[] }
  | { kind: "object"; entries: [string, Value][] };
export const MAX_CONVERSION_OUTPUT = 12_000_000;

export function fromJson(input: string): { value: Value; diagnostics: Diagnostic[] } {
  const validation = runJson(input, "validate", {});
  if (!validation.ok) throw new Error("JSON_PARSE_ERROR: " + validation.diagnostics[0]?.message);
  const document = parse(input, { mode: "json", ranges: true });
  const convert = (node: ValueNode): Value => {
    if (node.type === "Object") return { kind: "object", entries: node.members.map(member => [member.name.type === "String" ? member.name.value : member.name.name, convert(member.value)]) };
    if (node.type === "Array") return { kind: "array", items: node.elements.map(item => convert(item.value)) };
    if (!node.range) throw new Error("JSON source range unavailable");
    const source = input.slice(node.range[0], node.range[1]);
    if (node.type === "String") return { kind: "string", value: JSON.parse(source) };
    if (node.type === "Number") return { kind: "number", text: source };
    if (source === "true" || source === "false") return { kind: "boolean", value: source === "true" };
    return { kind: "null" };
  };
  return { value: convert(document.body), diagnostics: validation.diagnostics };
}

export function toJson(value: Value, indentation = 2): string {
  const pad = (depth: number) => " ".repeat(depth * indentation);
  const render = (node: Value, depth: number): string => {
    switch (node.kind) {
      case "null": return "null";
      case "boolean": return String(node.value);
      case "string": return JSON.stringify(node.value);
      case "number":
        if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(node.text)) throw new Error("NUMBER_MAPPING_LOSS: YAML number cannot be represented exactly as JSON.");
        return node.text;
      case "array":
        return node.items.length ? indentation ? "[\n" + node.items.map(item => pad(depth + 1) + render(item, depth + 1)).join(",\n") + "\n" + pad(depth) + "]" : "[" + node.items.map(item => render(item, depth + 1)).join(",") + "]" : "[]";
      case "object":
        return node.entries.length ? indentation ? "{\n" + node.entries.map(([key, item]) => pad(depth + 1) + JSON.stringify(key) + ": " + render(item, depth + 1)).join(",\n") + "\n" + pad(depth) + "}" : "{" + node.entries.map(([key, item]) => JSON.stringify(key) + ":" + render(item, depth + 1)).join(",") + "}" : "{}";
    }
  };
  const output = render(value, 0);
  if (output.length > MAX_CONVERSION_OUTPUT) throw new Error("OUTPUT_LIMIT: Converted result is too large.");
  return output;
}

export function fromJs(value: unknown, depth = 0): Value {
  if (depth > 128) throw new Error("DEPTH_LIMIT: Conversion nesting is too deep.");
  if (value === null || value === undefined) return { kind: "null" };
  if (typeof value === "boolean") return { kind: "boolean", value };
  if (typeof value === "string") return { kind: "string", value };
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { kind: "string", value: String(value) };
    return { kind: "number", text: String(value) };
  }
  if (Array.isArray(value)) return { kind: "array", items: value.map(item => fromJs(item, depth + 1)) };
  if (typeof value === "object") return { kind: "object", entries: Object.entries(value).map(([key, item]) => [key, fromJs(item, depth + 1)]) };
  throw new Error("UNSUPPORTED_VALUE: Cannot convert this value.");
}

export function duplicateKeys(value: Value): string[] {
  const duplicates: string[] = [];
  const walk = (node: Value) => {
    if (node.kind === "object") {
      const seen = new Set<string>();
      for (const [key, child] of node.entries) {
        if (seen.has(key)) duplicates.push(key);
        seen.add(key);
        walk(child);
      }
    } else if (node.kind === "array") node.items.forEach(walk);
  };
  walk(value);
  return duplicates;
}
