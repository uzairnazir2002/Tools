import { COLLECTION_STYLE_BLOCK, CORE_SCHEMA, SCALAR_STYLE_DOUBLE_QUOTED, SCALAR_STYLE_PLAIN, eventsToAst, load, mergeTag, parseEvents, present, type Document, type Node } from "js-yaml";
import { runYaml, YAML_LIMITS } from "@formatbase/yaml-engine";
import type { Diagnostic } from "@formatbase/tool-core";
import { fromJs, type Value } from "./canonical.ts";

const schema = CORE_SCHEMA.withTags(mergeTag);
const warning = (code: string, message: string): Diagnostic => ({ severity: "warning", code, message });
const JSON_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

export function fromYaml(input: string, mode: string): { value: Value; diagnostics: Diagnostic[] } {
  const validation = runYaml(input, "validate");
  if (!validation.ok) throw new Error("YAML_PARSE_ERROR: " + validation.diagnostics[0]?.message);
  const documents = eventsToAst(parseEvents(input, { maxDepth: YAML_LIMITS.depth }), { source: input, schema });
  const convert = (node: Node | null): Value => {
    if (!node) return { kind: "null" };
    if (node.kind === "alias") throw new Error("YAML_ALIAS_LOSS: YAML aliases cannot be represented directly in JSON.");
    if (node.kind === "sequence") return { kind: "array", items: node.items.map(convert) };
    if (node.kind === "mapping") {
      return { kind: "object", entries: node.items.map(pair => {
        if (pair.key.kind !== "scalar" || !pair.key.tag.endsWith(":str")) throw new Error("YAML_KEY_LOSS: YAML complex or nonstring keys cannot be represented in JSON.");
        if (pair.key.value === "<<") throw new Error("YAML_MERGE_LOSS: YAML merge keys cannot be represented directly in JSON.");
        return [pair.key.value, convert(pair.value)];
      }) };
    }
    if (node.tag.endsWith(":str")) return { kind: "string", value: node.value };
    if (node.tag.endsWith(":null")) return { kind: "null" };
    if (node.tag.endsWith(":bool")) return { kind: "boolean", value: node.value === "true" };
    if ((node.tag.endsWith(":int") || node.tag.endsWith(":float")) && JSON_NUMBER.test(node.value)) return { kind: "number", text: node.value };
    throw new Error("YAML_TYPE_LOSS: This YAML scalar cannot be represented exactly in JSON.");
  };
  try {
    if (documents.length !== 1) throw new Error("YAML_DOCUMENT_LOSS: A YAML stream cannot be represented as one JSON document.");
    return { value: convert(documents[0].contents), diagnostics: [] };
  } catch (error) {
    if (mode === "lossless") throw error;
    const source = documents.length === 1 ? load(input, { schema, maxDepth: YAML_LIMITS.depth, maxAliases: YAML_LIMITS.aliases, maxTotalMergeKeys: YAML_LIMITS.totalMergeKeys }) : documents.map(document => load(present([{ ...document, explicitStart: false }], { schema }), { schema, maxDepth: YAML_LIMITS.depth, maxAliases: YAML_LIMITS.aliases, maxTotalMergeKeys: YAML_LIMITS.totalMergeKeys }));
    return { value: fromJs(source), diagnostics: [warning("YAML_MAPPING_LOSS", (error as Error).message + " Values were materialized for conversion; numeric precision or YAML metadata may change.")] };
  }
}

export function toYaml(value: Value, mode: string): { output: string; diagnostics: Diagnostic[] } {
  const convert = (item: Value): Node => {
    const base = { tagged: false };
    switch (item.kind) {
      case "null": return { ...base, kind: "scalar", tag: "tag:yaml.org,2002:null", style: SCALAR_STYLE_PLAIN, value: "null" };
      case "boolean": return { ...base, kind: "scalar", tag: "tag:yaml.org,2002:bool", style: SCALAR_STYLE_PLAIN, value: String(item.value) };
      case "string": return { ...base, kind: "scalar", tag: "tag:yaml.org,2002:str", style: SCALAR_STYLE_DOUBLE_QUOTED, value: item.value };
      case "number": return { ...base, kind: "scalar", tag: "tag:yaml.org,2002:" + (/[.eE]/.test(item.text) ? "float" : "int"), style: SCALAR_STYLE_PLAIN, value: item.text };
      case "array": return { ...base, kind: "sequence", tag: "tag:yaml.org,2002:seq", style: COLLECTION_STYLE_BLOCK, items: item.items.map(convert) };
      case "object": return { ...base, kind: "mapping", tag: "tag:yaml.org,2002:map", style: COLLECTION_STYLE_BLOCK, items: item.entries.map(([key, child]) => ({ key: convert({ kind: "string", value: key }), value: convert(child) })) };
    }
  };
  const document: Document = { contents: convert(value), directives: [] };
  const output = present([document], { schema, indent: 2, lineWidth: -1 }).trimEnd();
  const validation = runYaml(output, "validate");
  if (!validation.ok) throw new Error("YAML_OUTPUT_ERROR: " + validation.diagnostics[0]?.message);
  const duplicates = mode === "lossless" ? [] : [];
  return { output, diagnostics: duplicates };
}
