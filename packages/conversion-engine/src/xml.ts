import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { runXml } from "@codeformattools/xml-engine";
import { siteConfig } from "@codeformattools/seo";
import type { Diagnostic } from "@codeformattools/tool-core";
import { fromJs, type Value } from "./canonical.ts";

type OrderedNode = Record<string, unknown>;
const parserOptions = { preserveOrder: true, ignoreAttributes: false, processEntities: false, trimValues: false, parseTagValue: false, parseAttributeValue: false, commentPropName: "#comment", cdataPropName: "#cdata" } as const;
const warning = (code: string, message: string): Diagnostic => ({ severity: "warning", code, message });

function toJs(value: Value): unknown {
  switch (value.kind) {
    case "null": return null;
    case "boolean": return value.value;
    case "string": return value.value;
    case "number": return value.text;
    case "array": return value.items.map(toJs);
    case "object": return Object.fromEntries(value.entries.map(([key, child]) => [key, toJs(child)]));
  }
}

export function fromXml(input: string, mode: string): { value: Value; diagnostics: Diagnostic[] } {
  const validation = runXml(input, "validate");
  if (!validation.ok) throw new Error("XML_PARSE_ERROR: " + validation.diagnostics[0]?.message);
  const ordered = new XMLParser(parserOptions).parse(input) as OrderedNode[];
  if (mode === "lossless") return { value: fromJs({ $format: siteConfig.xmlEnvelopeFormat, nodes: ordered }), diagnostics: [] };
  const elements = ordered.filter(node => Object.keys(node).some(key => !key.startsWith("#") && key !== ":@"));
  if (elements.length !== 1) throw new Error("XML_ROOT_ERROR: Expected exactly one root element.");
  const convertElement = (node: OrderedNode): Value => {
    const [, rawChildren] = Object.entries(node).find(([key]) => !key.startsWith("#") && key !== ":@")!;
    const children = rawChildren as OrderedNode[];
    const entries: [string, Value][] = [];
    const attrs = node[":@"] as Record<string, string> | undefined;
    if (attrs) for (const [key, value] of Object.entries(attrs)) entries.push(["@" + key.slice(2), { kind: "string", value }]);
    const text = children.filter(child => typeof child["#text"] === "string").map(child => child["#text"] as string).join("");
    if (text.trim()) entries.push(["#text", { kind: "string", value: text }]);
    const groups = new Map<string, Value[]>();
    for (const child of children) {
      const element = Object.keys(child).find(key => !key.startsWith("#") && key !== ":@");
      if (!element) continue;
      const values = groups.get(element) ?? [];
      values.push(convertElement(child));
      groups.set(element, values);
    }
    for (const [key, values] of groups) entries.push([key, values.length === 1 ? values[0] : { kind: "array", items: values }]);
    return { kind: "object", entries };
  };
  const root = elements[0];
  const rootName = Object.keys(root).find(key => !key.startsWith("#") && key !== ":@")!;
  return { value: { kind: "object", entries: [[rootName, convertElement(root)]] }, diagnostics: [warning("XML_MAPPING_LOSS", "XML comments, CDATA boundaries, sibling order, and some whitespace are not represented in the simplified JSON mapping.")] };
}

export function toXml(value: Value, mode: string): { output: string; diagnostics: Diagnostic[] } {
  if (mode === "lossless") {
    const payload = toJs(value) as { $format?: string; nodes?: unknown };
    const supportedEnvelope = payload?.$format === siteConfig.xmlEnvelopeFormat || payload?.$format === siteConfig.legacyXmlEnvelopeFormat;
    if (!payload || !supportedEnvelope || !Array.isArray(payload.nodes)) throw new Error("XML_ENVELOPE_REQUIRED: Lossless XML needs a Code Format Tools XML envelope with $format and nodes.");
    const output = new XMLBuilder({ ...parserOptions, format: false }).build(payload.nodes).trim();
    const validity = runXml(output, "validate");
    if (!validity.ok) throw new Error("XML_OUTPUT_ERROR: " + validity.diagnostics[0]?.message);
    return { output, diagnostics: [] };
  }
  const object = value.kind === "object" ? value.entries : [["root", value] as [string, Value]];
  if (object.length !== 1) throw new Error("XML_ROOT_ERROR: JSON must have exactly one root key.");
  const element = (name: string, content: Value): OrderedNode => {
    const children: OrderedNode[] = [];
    const attributes: Record<string, string> = {};
    if (content.kind === "object") {
      for (const [key, child] of content.entries) {
        if (key.startsWith("@")) { attributes["@_" + key.slice(1)] = String(toJs(child) ?? ""); continue; }
        if (key === "#text") { children.push({ "#text": String(toJs(child) ?? "") }); continue; }
        if (key === "#cdata") { children.push({ "#cdata": [{ "#text": String(toJs(child) ?? "") }] }); continue; }
        if (child.kind === "array") for (const item of child.items) children.push(element(key, item));
        else children.push(element(key, child));
      }
    } else if (content.kind !== "null") children.push({ "#text": String(toJs(content)) });
    return Object.keys(attributes).length ? { [name]: children, ":@": attributes } : { [name]: children };
  };
  const output = new XMLBuilder({ ...parserOptions, processEntities: true, format: true, indentBy: "  " }).build([element(object[0][0], object[0][1])]).trim();
  const validity = runXml(output, "validate");
  if (!validity.ok) throw new Error("XML_OUTPUT_ERROR: " + validity.diagnostics[0]?.message);
  return { output, diagnostics: [warning("XML_MAPPING_LOSS", "JSON types and structure were mapped to XML elements, text, and @attributes; review the result.")] };
}
