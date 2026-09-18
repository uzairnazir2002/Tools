import assert from "node:assert/strict";
import test from "node:test";
import { downloadMime } from "../lib/download-mime.ts";

test("download MIME types match generated file formats", () => {
  assert.equal(downloadMime("json"), "application/json;charset=utf-8");
  assert.equal(downloadMime("yaml"), "application/yaml;charset=utf-8");
  assert.equal(downloadMime("xml"), "application/xml;charset=utf-8");
  assert.equal(downloadMime("csv"), "text/csv;charset=utf-8");
  assert.equal(downloadMime("sql"), "application/sql;charset=utf-8");
  assert.equal(downloadMime("txt"), "text/plain;charset=utf-8");
});
