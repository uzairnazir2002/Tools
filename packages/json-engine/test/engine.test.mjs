import assert from "node:assert/strict";
import test from "node:test";
import { runJson } from "../src/index.ts";

const options = { indentation: 2 };
test("preserves large integers and decimals", () => {
  const input = '{"id":9123372036854000123,"rate":0.12345678901234567890123456789}';
  const result = runJson(input, "format", options);
  assert.equal(result.ok, true);
  assert.match(result.output, /9123372036854000123/);
  assert.match(result.output, /0\.12345678901234567890123456789/);
});
test("exact large integer token survives format and minify paths", () => {
  const input = '{"id":9123372036854000123}';
  assert.match(runJson(input, "format", options).output, /9123372036854000123/);
  assert.equal(runJson(input, "minify", options).output, '{"id":9123372036854000123}');
});
test("preserves and reports duplicate keys", () => {
  const result = runJson('{"a":1,"a":2}', "format", options);
  assert.equal(result.output.match(/"a"/g).length, 2);
  assert.equal(result.diagnostics[0].code, "DUPLICATE_KEY");
  assert.equal(result.diagnostics[0].line, 1);
});
test("sorts nested keys but keeps array order", () => {
  const result = runJson('{"z":[{"b":1,"a":2},3],"a":0}', "sort", options);
  assert.ok(result.output.indexOf('"a": 0') < result.output.indexOf('"z"'));
  assert.ok(result.output.indexOf('"a": 2') < result.output.indexOf('"b": 1'));
  assert.ok(result.output.indexOf('"b": 1') < result.output.indexOf('3'));
});
test("formatting is idempotent", () => {
  const first = runJson('{"b":[1,2],"a":true}', "format", options).output;
  assert.equal(runJson(first, "format", options).output, first);
});
test("minifies without converting values", () => {
  const result = runJson('{ "id": 9123372036854000123 }', "minify", options);
  assert.equal(result.output, '{"id":9123372036854000123}');
});
test("invalid JSON includes source location", () => {
  const result = runJson('{"a": 1,}', "validate", options);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].severity, "error");
  assert.equal(result.diagnostics[0].code, "TRAILING_COMMA");
  const fix = result.diagnostics[0].fix;
  assert.ok(fix);
  assert.equal(runJson('{"a": 1,}'.slice(0, fix.startOffset) + fix.replacement + '{"a": 1,}'.slice(fix.endOffset), "validate", options).ok, true);
  assert.ok(result.diagnostics[0].line);
  assert.ok(result.diagnostics[0].column);
});
test("explains common malformed input", () => {
  assert.equal(runJson("{'a':1}", "validate", options).diagnostics[0].code, "SINGLE_QUOTES");
  assert.equal(runJson('{"a":1 "b":2}', "validate", options).diagnostics[0].code, "MISSING_COMMA");
  assert.equal(runJson('{"a":"\\q"}', "validate", options).diagnostics[0].code, "BAD_ESCAPE");
  assert.equal(runJson('{"a":1', "validate", options).diagnostics[0].code, "UNEXPECTED_END");
});
test("rejects excessive depth but ignores braces inside strings", () => {
  const deep = `${"[".repeat(513)}0${"]".repeat(513)}`;
  assert.equal(runJson(deep, "validate", options).diagnostics[0].code, "DEPTH_LIMIT");
  assert.equal(runJson('{"text":"[[[[{"}', "validate", options).ok, true);
});
test("guards against extreme formatting expansion", () => {
  const chain = `${"[".repeat(511)}0${"]".repeat(511)}`;
  const input = `[${Array(30).fill(chain).join(",")}]`;
  const result = runJson(input, "format", options);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "OUTPUT_TOO_LARGE");
  assert.equal(runJson(input, "minify", options).ok, true);
});
