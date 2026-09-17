import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runJson } from "../src/index.ts";

const root = new URL("../../test-fixtures/json/", import.meta.url);
const fixture = name => readFileSync(new URL(name, root), "utf8").trimEnd();
const options = { indentation: 2 };
const valid = ["simple", "nested", "unicode", "emoji", "large-integer", "huge-decimal", "duplicate-keys", "deep-nesting", "large-array"];

for (const name of valid) test(`${name} fixture is stable across JSON actions`, () => {
  const input = fixture(`${name}.json`);
  const formatted = runJson(input, "format", options);
  const minified = runJson(input, "minify", options);
  const sorted = runJson(input, "sort", options);
  assert.equal(formatted.ok, true, `${name} format`);
  assert.equal(minified.ok, true, `${name} minify`);
  assert.equal(sorted.ok, true, `${name} sort`);
  assert.equal(runJson(formatted.output, "format", options).output, formatted.output);
  assert.equal(runJson(minified.output, "minify", options).output, minified.output);
  assert.equal(runJson(sorted.output, "sort", options).output, sorted.output);
  assert.equal(runJson(minified.output, "format", options).output, formatted.output);
});

test("golden formatting output remains stable", () => {
  assert.equal(runJson(fixture("simple.json"), "format", options).output, fixture("expected/simple.formatted.json"));
  assert.equal(runJson(fixture("nested.json"), "sort", options).output, fixture("expected/nested.sorted.json"));
  assert.equal(runJson(fixture("large-integer.json"), "format", options).output, fixture("expected/large-integer.formatted.json"));
  assert.equal(runJson(fixture("duplicate-keys.json"), "format", options).output, fixture("expected/duplicate-keys.formatted.json"));
  assert.equal(runJson(fixture("huge-decimal.json"), "minify", options).output, fixture("expected/huge-decimal.minified.json"));
  assert.equal(runJson(fixture("nested.json"), "minify", options).output, fixture("expected/nested.minified.json"));
});

test("malformed fixtures have actionable diagnostics", () => {
  const codes = { "trailing-comma": "TRAILING_COMMA", "single-quotes": "SINGLE_QUOTES", "bad-escape": "BAD_ESCAPE", "unclosed-object": "UNEXPECTED_END" };
  for (const [name, code] of Object.entries(codes)) {
    const result = runJson(fixture(`${name}.json`), "validate", options);
    assert.equal(result.ok, false, name);
    assert.equal(result.diagnostics[0].code, code, name);
    assert.ok(result.diagnostics[0].line);
    assert.ok(result.diagnostics[0].column);
  }
});

test("generated JSON structures round trip without semantic changes", () => {
  let seed = 72_398;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const value = depth => {
    const kind = depth > 4 ? 0 : Math.floor(random() * 5);
    if (kind === 0) return Math.floor(random() * 2000) - 1000;
    if (kind === 1) return `s${Math.floor(random() * 1000)}\n\"`;
    if (kind === 2) return random() > .5;
    if (kind === 3) return Array.from({ length: Math.floor(random() * 5) }, () => value(depth + 1));
    return { a: value(depth + 1), b: value(depth + 1) };
  };
  for (let i = 0; i < 100; i++) {
    const original = value(0);
    const input = JSON.stringify(original);
    for (const action of ["format", "minify", "sort"]) {
      const result = runJson(input, action, options);
      assert.equal(result.ok, true);
      assert.deepEqual(JSON.parse(result.output), original);
    }
  }
});
