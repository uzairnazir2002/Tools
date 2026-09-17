import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, writeCsv } from "../src/index.ts";

test("CSV retains quoted commas, newlines, and Unicode", () => {
  const table = parseCsv('name,note\nAisha,"hello, world"\nZoë,"line one\nline two"\n');
  assert.deepEqual(table.headers, ["name", "note"]);
  assert.deepEqual(table.rows, [["Aisha", "hello, world"], ["Zoë", "line one\nline two"]]);
  const output = writeCsv(table.headers, table.rows);
  assert.deepEqual(parseCsv(output.output).rows, table.rows);
});

test("CSV rejects duplicate and uneven headers and malformed quotes", () => {
  assert.throws(() => parseCsv("a,a\n1,2"), /CSV_DUPLICATE_HEADER/);
  assert.throws(() => parseCsv("a,b\n1"), /CSV_FIELD_MISMATCH|CSV_PARSE_ERROR/);
  assert.throws(() => parseCsv('a\n"unterminated'), /CSV_PARSE_ERROR/);
});

test("formula-like cells are escaped but negative numbers stay intact", () => {
  const result = writeCsv(["value"], [["=2+2"], ["-1"]]);
  assert.match(result.output, /'=2\+2/);
  assert.match(result.output, /\n-1$/);
  assert.equal(result.diagnostics[0].code, "CSV_FORMULA_ESCAPED");
});

test("row count is stopped during parsing", () => {
  assert.throws(() => parseCsv("value\n" + "x\n".repeat(100_002)), /CSV_ROW_LIMIT/);
});
