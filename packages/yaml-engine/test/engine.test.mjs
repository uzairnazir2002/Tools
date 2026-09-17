import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runYaml, YAML_LIMITS } from "../src/index.ts";

const fixture = name => readFileSync(new URL(`../../test-fixtures/yaml/${name}.yaml`, import.meta.url), "utf8");
const expected = name => readFileSync(new URL(`../../test-fixtures/yaml/expected/${name}.yaml`, import.meta.url), "utf8").trimEnd();

for (const name of ["simple", "unicode", "multidocument", "alias-heavy", "merge-heavy"]) test(`${name} formats, validates, and is idempotent`, () => {
  const first = runYaml(fixture(name), "format", { indentation: 2 });
  assert.equal(first.ok, true, first.diagnostics[0]?.message);
  assert.equal(first.output, expected(name));
  assert.equal(runYaml(first.output, "format", { indentation: 2 }).output, first.output);
  assert.equal(runYaml(fixture(name), "validate").ok, true);
});

test("formatter obeys indentation and validator leaves input untouched", () => {
  const input = "service: {name: api, ports: [80, 443]}";
  const two = runYaml(input, "format", { indentation: 2 });
  const four = runYaml(input, "format", { indentation: 4 });
  assert.equal(two.ok, true);
  assert.equal(four.ok, true);
  assert.match(two.output, /\n  name: api/);
  assert.match(four.output, /\n    name: api/);
  assert.deepEqual(runYaml(input, "validate"), { ok: true, output: "", diagnostics: [] });
});

test("numeric text and anchor names survive formatting; comments warn", () => {
  const source = "big: 9123372036854000123\nbase: &original [1, 2]\ncopy: *original # note\n";
  const result = runYaml(source, "format");
  assert.equal(result.ok, true);
  assert.match(result.output, /9123372036854000123/);
  assert.match(result.output, /&original/);
  assert.match(result.output, /\*original/);
  assert.equal(result.diagnostics[0].code, "YAML_COMMENTS_REMOVED");
});

test("malformed YAML returns a source location", () => {
  const result = runYaml(fixture("malformed"), "validate");
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "YAML_PARSE_ERROR");
  assert.ok(result.diagnostics[0].line);
  assert.ok(result.diagnostics[0].column);
});

test("deep nesting is rejected", () => {
  const result = runYaml(fixture("deep-nesting"), "validate");
  assert.equal(result.ok, false);
  assert.match(result.diagnostics[0].message, /depth/i);
});

test("too many aliases are rejected", () => {
  const result = runYaml(fixture("alias-limit"), "validate");
  assert.equal(result.ok, false);
  assert.match(result.diagnostics[0].message, /alias/i);
});

test("merge-key work is bounded", () => {
  const result = runYaml(fixture("merge-limit"), "validate");
  assert.equal(result.ok, false);
  assert.match(result.diagnostics[0].message, /merge/i);
});

test("large scalar stays bounded and retains its content", () => {
  const result = runYaml(fixture("huge-scalar"), "format");
  assert.equal(result.ok, true, result.diagnostics[0]?.message);
  assert.ok(result.output.length >= 131072);
  assert.match(result.output, /^description: x+/);
});

test("extreme scalar lines are rejected before parser stack exhaustion", () => {
  const result = runYaml(`description: ${"x".repeat(YAML_LIMITS.lineCharacters + 1)}`, "format");
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "YAML_LINE_LIMIT");
});

test("recursive aliases are rejected before formatting", () => {
  const result = runYaml(fixture("recursive"), "format");
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "YAML_SAFETY_LIMIT");
});

test("document count and invalid action are rejected", () => {
  const stream = Array(YAML_LIMITS.documents + 1).fill("---\na: 1").join("\n");
  assert.equal(runYaml(stream, "validate").diagnostics[0].code, "YAML_DOCUMENT_LIMIT");
  assert.equal(runYaml("a: 1", "unknown").diagnostics[0].code, "INVALID_ACTION");
});

test("generated malformed inputs return bounded results", () => {
  let seed = 214317;
  const alphabet = "[]{}:,#&*'\"- abc123\n";
  for (let sample = 0; sample < 100; sample++) {
    let input = "";
    for (let i = 0; i < 60; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      input += alphabet[seed % alphabet.length];
    }
    const result = runYaml(input, "format");
    assert.equal(typeof result.ok, "boolean");
    assert.ok(result.output.length <= YAML_LIMITS.outputCharacters);
  }
});
