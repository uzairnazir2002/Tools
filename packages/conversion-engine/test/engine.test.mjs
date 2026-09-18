import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runConversion } from "../src/index.ts";

const fixture = name => readFileSync(new URL("../../test-fixtures/conversion/" + name, import.meta.url), "utf8").trimEnd();
const run = (tool, input, mode = "lossless") => runConversion(tool, input, { mode });

test("JSON to YAML and back retains large number text", () => {
  const input = '{"name":"api","big":9123372036854000123}';
  const yaml = run("json-to-yaml", input);
  assert.equal(yaml.ok, true, yaml.diagnostics[0]?.message);
  assert.match(yaml.output, /9123372036854000123/);
  const json = run("yaml-to-json", yaml.output);
  assert.equal(json.ok, true, json.diagnostics[0]?.message);
  assert.match(json.output, /9123372036854000123/);
});

test("YAML source fixture converts and aliases need an explicit lossy mode", () => {
  const plain = run("yaml-to-json", fixture("record.yaml"));
  assert.equal(plain.ok, true);
  assert.match(plain.output, /"port": 8080/);
  const aliased = "base: &base {a: 1}\ncopy: *base";
  assert.equal(run("yaml-to-json", aliased).diagnostics[0].code, "YAML_ALIAS_LOSS");
  const best = run("yaml-to-json", aliased, "best-effort");
  assert.equal(best.ok, true);
  assert.equal(best.diagnostics[0].code, "YAML_MAPPING_LOSS");
  assert.match(best.output, /"copy"/);
});

test("JSON duplicate keys require a mapping decision", () => {
  const input = '{"a":1,"a":2}';
  assert.equal(run("json-to-yaml", input).diagnostics[0].code, "DUPLICATE_KEY_LOSS");
  const best = run("json-to-yaml", input, "best-effort");
  assert.equal(best.ok, true);
  assert.match(best.output, /"a": 2/);
  assert.equal(best.diagnostics.some(item => item.code === "DUPLICATE_KEY_LOSS"), true);
});

test("XML lossless envelope round trips attributes, comments, CDATA, and order", () => {
  const original = '<root><!-- note --><item id="1">A &amp; B</item><![CDATA[<raw>]]></root>';
  const json = run("xml-to-json", original);
  assert.equal(json.ok, true);
  assert.match(json.output, /codeformattools.xml.v1/);
  const xml = run("json-to-xml", json.output);
  assert.equal(xml.ok, true, xml.diagnostics[0]?.message);
  assert.equal(xml.output, original);
});

test("XML lossless mode accepts legacy Formatbase envelopes during migration", () => {
  const legacy = '{"$format":"formatbase.xml.v1","nodes":[{"root":[{"item":[{"#text":"A"}]}]}]}';
  const xml = run("json-to-xml", legacy);
  assert.equal(xml.ok, true, xml.diagnostics[0]?.message);
  assert.equal(xml.output, "<root><item>A</item></root>");
});

test("XML best effort maps attributes and repeated elements with warnings", () => {
  const json = run("xml-to-json", '<root><item id="1">A</item><item id="2">B</item></root>', "best-effort");
  assert.equal(json.ok, true);
  assert.match(json.output, /"@id": "1"/);
  assert.match(json.output, /"item": \[/);
  assert.equal(json.diagnostics[0].code, "XML_MAPPING_LOSS");
  const xml = run("json-to-xml", '{"root":{"item":[{"@id":"1","#text":"A"},{"@id":"2","#text":"B"}]}}', "best-effort");
  assert.equal(xml.ok, true, xml.diagnostics[0]?.message);
  assert.match(xml.output, /<item id="2">B<\/item>/);
});

test("JSON to CSV and CSV to JSON make type changes explicit", () => {
  const csv = run("json-to-csv", fixture("records.json"), "best-effort");
  assert.equal(csv.ok, true);
  assert.match(csv.output, /^name,age\n/);
  assert.equal(csv.diagnostics.some(item => item.code === "CSV_TYPE_LOSS"), true);
  const json = run("csv-to-json", fixture("records.csv"));
  assert.equal(json.ok, true);
  assert.match(json.output, /"age": "30"/);
  const inferred = run("csv-to-json", fixture("records.csv"), "best-effort");
  assert.equal(inferred.ok, true);
  assert.match(inferred.output, /"age": 30/);
  assert.equal(inferred.diagnostics[0].code, "CSV_TYPE_INFERENCE");
});

test("CSV lossless accepts flat strings and rejects non-string data", () => {
  const flat = run("json-to-csv", '[{"name":"A","id":"1"}]');
  assert.equal(flat.ok, true);
  assert.equal(flat.output, "name,id\nA,1");
  assert.equal(run("json-to-csv", fixture("records.json")).diagnostics[0].code, "CSV_TYPE_LOSS");
});

test("CSV compatibility serializes nested cells and guards spreadsheet formulae", () => {
  const nested = run("json-to-csv", '[{"data":{"a":1}}]', "compatibility");
  assert.equal(nested.ok, true);
  assert.match(nested.output, /\{""a"":1\}/);
  assert.equal(nested.diagnostics.some(item => item.code === "CSV_NESTED_STRINGIFIED"), true);
  const formula = run("json-to-csv", fixture("formula.json"), "best-effort");
  assert.equal(formula.ok, true);
  assert.match(formula.output, /'=2\+2/);
  assert.equal(formula.diagnostics.some(item => item.code === "CSV_FORMULA_ESCAPED"), true);
});

test("CSV malformed data and duplicate headers fail cleanly", () => {
  assert.equal(run("csv-to-json", fixture("malformed.csv")).ok, false);
  assert.equal(run("csv-to-json", fixture("duplicate.csv")).diagnostics[0].code, "CSV_DUPLICATE_HEADER");
});

test("JSON to XML lossless requires the reversible envelope", () => {
  assert.equal(run("json-to-xml", '{"root":{"item":"A"}}').diagnostics[0].code, "XML_ENVELOPE_REQUIRED");
});

test("invalid tools and input return structured diagnostics", () => {
  assert.equal(run("not-a-tool", "{}").diagnostics[0].code, "INVALID_CONVERSION");
  assert.equal(run("json-to-yaml", "{bad}").ok, false);
});

test("six conversion golden outputs stay stable", () => {
  const cases = [
    ["json-to-yaml", fixture("records.json"), "lossless", "yaml"],
    ["yaml-to-json", fixture("record.yaml"), "lossless", "json"],
    ["xml-to-json", fixture("record.xml"), "lossless", "json"],
    ["json-to-xml", '{"catalog":{"item":{"@id":"1","#text":"Book"}}}', "best-effort", "xml"],
    ["json-to-csv", fixture("records.json"), "best-effort", "csv"],
    ["csv-to-json", fixture("records.csv"), "lossless", "json"]
  ];
  for (const [tool, source, mode, extension] of cases) {
    const result = run(tool, source, mode);
    assert.equal(result.ok, true, tool + ": " + result.diagnostics[0]?.message);
    assert.equal(result.output, fixture("expected/" + tool + "." + extension), tool);
  }
});

test("generated JSON subsets round trip through YAML without changing values", () => {
  let seed = 583719;
  for (let sample = 0; sample < 100; sample++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const number = seed % 1_000_000;
    const source = JSON.stringify({ name: "item-" + sample, values: [number, true, null, "hello:" + sample] });
    const yaml = run("json-to-yaml", source);
    assert.equal(yaml.ok, true, yaml.diagnostics[0]?.message);
    const json = run("yaml-to-json", yaml.output);
    assert.equal(json.ok, true, json.diagnostics[0]?.message);
    assert.deepEqual(JSON.parse(json.output), JSON.parse(source));
  }
});
