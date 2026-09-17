import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runSql } from "../src/index.ts";

const fixture = name => readFileSync(new URL(`../../test-fixtures/sql/${name}.sql`, import.meta.url), "utf8").trimEnd();
const expected = name => readFileSync(new URL(`../../test-fixtures/sql/expected/${name}.sql`, import.meta.url), "utf8").trimEnd();
const options = { dialect: "sql", indentation: 2, keywordCase: "upper", linesBetweenQueries: 1 };

const dialectFixtures = [
  ["standard", "sql"], ["postgres", "postgresql"], ["mysql", "mysql"], ["mariadb", "mariadb"],
  ["bigquery", "bigquery"], ["snowflake", "snowflake"], ["tsql", "transactsql"],
  ["oracle", "plsql"], ["redshift", "redshift"], ["duckdb", "duckdb"],
  ["clickhouse", "clickhouse"], ["sqlite", "sqlite"]
];

for (const [name, dialect] of dialectFixtures) test(`${name} SQL dialect formats and is idempotent`, () => {
  const first = runSql(fixture(name), { ...options, dialect });
  assert.equal(first.ok, true, first.diagnostics[0]?.message);
  assert.ok(first.output.length);
  assert.equal(first.output, expected(name));
  const second = runSql(first.output, { ...options, dialect });
  assert.equal(second.ok, true);
  assert.equal(second.output, first.output);
});

for (const name of ["cte", "window-functions", "subqueries", "comments", "placeholders"]) test(`${name} syntax is retained`, () => {
  const result = runSql(fixture(name), options);
  assert.equal(result.ok, true, result.diagnostics[0]?.message);
  assert.ok(result.output.length);
  assert.equal(result.output, expected(name));
});

test("comments and placeholders survive formatting", () => {
  const comments = runSql(fixture("comments"), options);
  const positional = runSql(fixture("placeholders"), options);
  const sqliteNamed = runSql("select id from users where name = :name and id = @id;", { ...options, dialect: "sqlite" });
  const postgresNumbered = runSql("select id from users where id = $1;", { ...options, dialect: "postgresql" });
  assert.equal(comments.ok, true);
  assert.match(comments.output, /--/);
  assert.equal(positional.ok, true);
  assert.equal((positional.output.match(/\?/g) ?? []).length, 2);
  assert.equal(sqliteNamed.ok, true);
  assert.match(sqliteNamed.output, /:name/);
  assert.match(sqliteNamed.output, /@id/);
  assert.equal(postgresNumbered.ok, true);
  assert.match(postgresNumbered.output, /\$1/);
});

test("keyword case and indentation options affect output", () => {
  const upper = runSql("select id from users;", options).output;
  const lower = runSql("SELECT id FROM users;", { ...options, keywordCase: "lower" }).output;
  const tabs = runSql("select id from users;", { ...options, indentation: "tab" }).output;
  assert.match(upper, /SELECT/);
  assert.match(lower, /select/);
  assert.match(tabs, /\t/);
  assert.doesNotMatch(lower, /SELECT/);
  const preserve = runSql("SeLeCt id FrOm users;", { ...options, keywordCase: "preserve", indentation: 4 }).output;
  assert.match(preserve, /SeLeCt/);
  assert.match(preserve, /FrOm/);
  assert.match(preserve, /^ {4}id/m);
});
test("query spacing option separates statements", () => {
  const one = runSql("select 1; select 2;", options).output;
  const three = runSql("select 1; select 2;", { ...options, linesBetweenQueries: 3 }).output;
  assert.ok(three.length > one.length);
});
test("invalid SQL has a location-aware diagnostic", () => {
  const result = runSql(fixture("invalid"), options);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "SQL_PARSE_ERROR");
  assert.ok(result.diagnostics[0].line);
  assert.ok(result.diagnostics[0].column);
});
