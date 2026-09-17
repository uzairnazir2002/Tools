import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runXml, XML_LIMITS } from "../src/index.ts";

const fixture = name => readFileSync(new URL("../../test-fixtures/xml/" + name + ".xml", import.meta.url), "utf8");
const expected = name => readFileSync(new URL("../../test-fixtures/xml/expected/" + name + ".xml", import.meta.url), "utf8").trimEnd();

for (const name of ["simple", "comments", "cdata", "namespaces"]) test(name + " formats, validates, and is idempotent", () => {
  const first = runXml(fixture(name), "format", { indentation: 2 });
  assert.equal(first.ok, true, first.diagnostics[0]?.message);
  assert.equal(first.output, expected(name));
  assert.equal(runXml(first.output, "format", { indentation: 2 }).output, first.output);
  assert.equal(runXml(fixture(name), "validate").ok, true);
});

test("formatter retains attributes, namespace prefixes, comments, CDATA, and entity text", () => {
  assert.match(runXml(fixture("comments"), "format").output, /<!-- keep me -->/);
  assert.match(runXml(fixture("comments"), "format").output, /value &amp; more/);
  assert.match(runXml(fixture("cdata"), "format").output, /<!\[CDATA\[<literal> & raw\]\]>/);
  assert.match(runXml(fixture("namespaces"), "format").output, /a:item a:id="1"/);
  assert.match(runXml(fixture("simple"), "format", { indentation: 4 }).output, /\n    <item/);
});

test("mixed content stays unchanged and warns about whitespace", () => {
  const result = runXml(fixture("mixed"), "format");
  assert.equal(result.ok, true);
  assert.equal(result.output, fixture("mixed").trim());
  assert.equal(result.diagnostics[0].code, "XML_MIXED_CONTENT");
});

test("xml:space preserve stays unchanged", () => {
  const input = '<root xml:space="preserve">  <item> ok </item>  </root>';
  const result = runXml(input, "format");
  assert.equal(result.ok, true);
  assert.equal(result.output, input);
  assert.equal(result.diagnostics[0].code, "XML_SPACE_PRESERVE");
});

test("validator reports malformed XML with location", () => {
  const result = runXml(fixture("malformed"), "validate");
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "XML_SYNTAX_ERROR");
  assert.ok(result.diagnostics[0].line);
  assert.ok(result.diagnostics[0].column);
});

test("DOCTYPE and entity expansion fixtures are blocked before parsing", () => {
  for (const name of ["doctype", "entity-expansion"]) {
    const result = runXml(fixture(name), "format");
    assert.equal(result.ok, false);
    assert.equal(result.diagnostics[0].code, "XML_DECLARATION_BLOCKED");
  }
});

test("unknown and invalid numeric entities are rejected", () => {
  assert.equal(runXml("<root>&custom;</root>", "validate").diagnostics[0].code, "XML_ENTITY_ERROR");
  assert.equal(runXml("<root>&#x110000;</root>", "validate").diagnostics[0].code, "XML_ENTITY_ERROR");
  assert.equal(runXml("<root>&#x41;</root>", "validate").ok, true);
});

test("nested tags and oversized attributes are rejected before parsing", () => {
  assert.equal(runXml(fixture("deeply-nested"), "validate").diagnostics[0].code, "XML_DEPTH_LIMIT");
  assert.equal(runXml(fixture("large-attributes"), "validate").diagnostics[0].code, "XML_TAG_LIMIT");
});

test("entity count and invalid action are bounded", () => {
  const entities = "<root>" + "&amp;".repeat(XML_LIMITS.entities + 1) + "</root>";
  assert.equal(runXml(entities, "validate").diagnostics[0].code, "XML_ENTITY_LIMIT");
  assert.equal(runXml("<root/>", "other").diagnostics[0].code, "INVALID_ACTION");
});

test("generated malformed XML never throws", () => {
  let seed = 713249;
  const alphabet = "<>/&;='\\\" abc123\n";
  for (let sample = 0; sample < 100; sample++) {
    let input = "";
    for (let i = 0; i < 60; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      input += alphabet[seed % alphabet.length];
    }
    const result = runXml(input, "format");
    assert.equal(typeof result.ok, "boolean");
    assert.ok(result.output.length <= XML_LIMITS.outputCharacters);
  }
});
