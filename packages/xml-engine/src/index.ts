import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import type { Diagnostic, ToolOptions } from "@formatbase/tool-core";

export const XML_LIMITS = { depth: 128, tags: 100_000, tagCharacters: 100_000, entities: 10_000, outputCharacters: 12_000_000 } as const;
type Result = { ok: boolean; output: string; diagnostics: Diagnostic[] };
type OrderedNode = Record<string, unknown>;
const parserOptions = { preserveOrder: true, ignoreAttributes: false, processEntities: false, trimValues: false, parseTagValue: false, parseAttributeValue: false, commentPropName: "#comment", cdataPropName: "#cdata" } as const;

function issue(code: string, message: string, input: string, offset?: number): Result {
  if (offset === undefined) return { ok: false, output: "", diagnostics: [{ severity: "error", code, message }] };
  const before = input.slice(0, offset);
  const line = before.split("\n").length;
  const column = offset - before.lastIndexOf("\n");
  return { ok: false, output: "", diagnostics: [{ severity: "error", code, message, line, column, startOffset: offset, endOffset: offset + 1 }] };
}

function scanStructure(input: string): Result | null {
  let depth = 0, tags = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== "<") continue;
    if (input.startsWith("<!--", i) || input.startsWith("<![CDATA[", i) || input.startsWith("<?", i)) {
      const endMark = input.startsWith("<!--", i) ? "-->" : input.startsWith("<![CDATA[", i) ? "]]>" : "?>";
      const end = input.indexOf(endMark, i + 2);
      if (end < 0) return issue("XML_SYNTAX_ERROR", "Unclosed XML section.", input, i);
      i = end + endMark.length - 1;
      continue;
    }
    if (input.startsWith("<!", i)) return issue("XML_DECLARATION_BLOCKED", "DOCTYPE and other XML declarations are disabled for safety.", input, i);
    const closing = input[i + 1] === "/";
    let quote = "", end = i + 1;
    for (; end < input.length; end++) {
      const char = input[end];
      if (quote) { if (char === quote) quote = ""; }
      else if (char === "\"" || char === "'") quote = char;
      else if (char === ">") break;
      if (end - i > XML_LIMITS.tagCharacters) return issue("XML_TAG_LIMIT", "An XML tag or attribute exceeds the safety limit.", input, i);
    }
    if (end === input.length) return issue("XML_SYNTAX_ERROR", "Unclosed XML tag.", input, i);
    const selfClosing = !closing && input.slice(i, end).trimEnd().endsWith("/");
    if (++tags > XML_LIMITS.tags) return issue("XML_TAG_LIMIT", "XML has too many tags.", input, i);
    if (closing) depth--;
    else if (!selfClosing) depth++;
    if (depth > XML_LIMITS.depth) return issue("XML_DEPTH_LIMIT", "XML exceeds the 128 level depth limit.", input, i);
    i = end;
  }
  return null;
}

function checkEntities(value: string, input: string): Result | null {
  const allowed = new Set(["amp", "lt", "gt", "apos", "quot"]);
  let count = 0;
  for (let index = value.indexOf("&"); index !== -1; index = value.indexOf("&", index + 1)) {
    if (++count > XML_LIMITS.entities) return issue("XML_ENTITY_LIMIT", "XML has too many entity references.", input);
    const match = /^&(#x[\da-fA-F]+|#\d+|[A-Za-z_][\w.-]*);/.exec(value.slice(index));
    if (!match) return issue("XML_ENTITY_ERROR", "Malformed XML entity reference.", input);
    const name = match[1];
    if (name.startsWith("#")) {
      const number = name[1] === "x" ? Number.parseInt(name.slice(2), 16) : Number.parseInt(name.slice(1), 10);
      if (!Number.isFinite(number) || number <= 0 || number > 0x10ffff || (number >= 0xd800 && number <= 0xdfff)) return issue("XML_ENTITY_ERROR", "Invalid numeric XML entity.", input);
    } else if (!allowed.has(name)) return issue("XML_ENTITY_ERROR", "Unknown XML entity &" + name + ";. DOCTYPE entities are disabled.", input);
    index += match[0].length - 1;
  }
  return null;
}

function inspect(nodes: OrderedNode[], input: string): { issue: Result | null; mixed: boolean } {
  const stack = [...nodes];
  let mixed = false;
  while (stack.length) {
    const node = stack.pop()!;
    for (const [key, value] of Object.entries(node)) {
      if (key === ":@") {
        for (const attribute of Object.values(value as Record<string, unknown>)) {
          const error = checkEntities(String(attribute), input);
          if (error) return { issue: error, mixed };
        }
      } else if (key === "#text") {
        const error = checkEntities(String(value), input);
        if (error) return { issue: error, mixed };
      } else if (Array.isArray(value) && (key === "#cdata" || key === "#comment")) {
        continue;
      } else if (Array.isArray(value)) {
        if (!key.startsWith("#") && value.some(item => typeof item["#text"] === "string" && item["#text"].trim()) && value.some(item => Object.keys(item).some(child => child !== "#text" && child !== ":@"))) mixed = true;
        stack.push(...value);
      }
    }
  }
  return { issue: null, mixed };
}

function removeIndentation(nodes: OrderedNode[]) {
  const stack = [nodes];
  while (stack.length) {
    const children = stack.pop()!;
    const hasElement = children.some(node => Object.keys(node).some(key => key !== "#text" && key !== ":@" && !key.startsWith("#")));
    if (hasElement) {
      for (let index = children.length - 1; index >= 0; index--) {
        const node = children[index];
        if (Object.keys(node).length === 1 && typeof node["#text"] === "string" && !node["#text"].trim()) children.splice(index, 1);
      }
    }
    for (const node of children) for (const [key, value] of Object.entries(node)) if (Array.isArray(value) && !key.startsWith("#")) stack.push(value);
  }
}

export function runXml(input: string, action: string, options: ToolOptions = {}): Result {
  if (action !== "format" && action !== "validate") return issue("INVALID_ACTION", "Unknown XML operation.", input);
  const structural = scanStructure(input);
  if (structural) return structural;
  const validity = XMLValidator.validate(input);
  if (validity !== true) {
    const line = validity.err.line, column = validity.err.col;
    let offset = 0, current = 1;
    while (current < line && offset < input.length) if (input[offset++] === "\n") current++;
    return issue("XML_SYNTAX_ERROR", validity.err.msg, input, Math.min(input.length, offset + column - 1));
  }
  try {
    const ordered = new XMLParser(parserOptions).parse(input) as OrderedNode[];
    const inspection = inspect(ordered, input);
    if (inspection.issue) return inspection.issue;
    if (action === "validate") return { ok: true, output: "", diagnostics: [] };
    if (inspection.mixed) return { ok: true, output: input.trim(), diagnostics: [{ severity: "warning", code: "XML_MIXED_CONTENT", message: "Mixed text and elements were kept unchanged to preserve text spacing." }] };
    if (/xml:space\s*=\s*["']preserve["']/.test(input)) return { ok: true, output: input.trim(), diagnostics: [{ severity: "warning", code: "XML_SPACE_PRESERVE", message: "xml:space=preserve was kept unchanged to protect whitespace." }] };
    removeIndentation(ordered);
    const indentBy = options.indentation === 4 ? "    " : options.indentation === "tab" ? "\t" : "  ";
    const output = new XMLBuilder({ ...parserOptions, format: true, indentBy }).build(ordered).trim();
    if (output.length > XML_LIMITS.outputCharacters) return issue("XML_OUTPUT_LIMIT", "Formatted XML exceeds the output safety limit.", input);
    return { ok: true, output, diagnostics: [] };
  } catch { return issue("XML_PARSE_ERROR", "XML could not be processed safely.", input); }
}
