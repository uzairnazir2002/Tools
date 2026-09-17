import assert from "node:assert/strict";
import test from "node:test";
import { executeRequest } from "../src/index.ts";

test("routes a valid request to the JSON engine", async () => {
  const result = await executeRequest({ requestId: "1", tool: "json-minifier", engine: "json", action: "minify", input: '{ "a": 1 }', options: {} });
  assert.equal(result.ok, true);
  assert.equal(result.output, '{"a":1}');
  assert.equal(result.requestId, "1");
});
test("routes SQL requests to the SQL engine", async () => {
  const result = await executeRequest({ requestId: "sql-1", tool: "sql-formatter", engine: "sql", action: "format", input: "select id from users where id = ?;", options: { dialect: "sql", indentation: 2, keywordCase: "upper", linesBetweenQueries: 1 } });
  assert.equal(result.ok, true);
  assert.match(result.output, /SELECT/);
  assert.match(result.output, /\?/);
  assert.equal(result.requestId, "sql-1");
  assert.ok(result.metrics.durationMs >= 0);
});
test("routes YAML format and validate requests with safety diagnostics", async () => {
  const formatted = await executeRequest({ requestId: "yaml-1", tool: "yaml-formatter", engine: "yaml", action: "format", input: "service: {name: api}", options: { indentation: 2 } });
  assert.equal(formatted.ok, true);
  assert.match(formatted.output, /\n  name: api/);
  const invalid = await executeRequest({ requestId: "yaml-2", tool: "yaml-validator", engine: "yaml", action: "validate", input: "name: [oops", options: {} });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.diagnostics[0].code, "YAML_PARSE_ERROR");
});
test("routes XML requests with DOCTYPE protection", async () => {
  const formatted = await executeRequest({ requestId: "xml-1", tool: "xml-formatter", engine: "xml", action: "format", input: "<root><item>ok</item></root>", options: { indentation: 2 } });
  assert.equal(formatted.ok, true);
  assert.match(formatted.output, /\n  <item>/);
  const blocked = await executeRequest({ requestId: "xml-2", tool: "xml-validator", engine: "xml", action: "validate", input: "<!DOCTYPE r><r/>", options: {} });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.diagnostics[0].code, "XML_DECLARATION_BLOCKED");
});
test("routes conversion requests to the canonical conversion engine", async () => {
  const converted = await executeRequest({ requestId: "conversion-1", tool: "json-to-yaml", engine: "conversion", action: "convert", input: '{"big":9123372036854000123}', options: { mode: "lossless" } });
  assert.equal(converted.ok, true);
  assert.match(converted.output, /9123372036854000123/);
  assert.equal(converted.requestId, "conversion-1");
});
test("rejects mismatched tool and action", async () => {
  const result = await executeRequest({ requestId: "2", tool: "json-validator", engine: "json", action: "minify", input: "{}", options: {} });
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "INVALID_REQUEST");
});
test("does not return raw input in an error", async () => {
  const result = await executeRequest({ requestId: "3", tool: "unknown", engine: "json", action: "format", input: "PRIVATE_SECRET", options: {} });
  assert.equal(JSON.stringify(result).includes("PRIVATE_SECRET"), false);
});
test("enforces the size limit inside the worker runtime", async () => {
  const result = await executeRequest({ requestId: "4", tool: "json-validator", engine: "json", action: "validate", input: " ".repeat(3 * 1024 * 1024 + 1), options: {} });
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "INPUT_TOO_LARGE");
});
