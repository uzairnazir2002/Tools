import assert from "node:assert/strict";
import test from "node:test";
import { categories, tools, validateRegistry } from "../src/index.ts";

test("every registered tool has a valid, unique route and references", () => {
  assert.deepEqual(validateRegistry(tools), []);
  assert.equal(new Set(tools.map(tool => tool.slug)).size, tools.length);
});
test("every option has a defined default and format specific metadata", () => {
  for (const tool of tools) {
    assert.ok(tool.category);
    assert.ok(tool.engine);
    assert.ok(tool.input.language);
    assert.ok(tool.output.language);
    assert.ok(tool.input.extensions.length);
    assert.equal(tool.privacy, "local");
    for (const option of tool.options) assert.notEqual(option.defaultValue, undefined);
  }
});
test("every tool has unique SEO content and complete page sections", () => {
  assert.equal(tools.length, 15);
  assert.equal(categories.length, 6);
  const uniqueFields = [
    ["title", tool => tool.seo.title],
    ["description", tool => tool.seo.description],
    ["example", tool => tool.example],
    ["common errors", tool => JSON.stringify(tool.commonErrors)],
    ["faq", tool => JSON.stringify(tool.faq)]
  ];
  for (const [name, getter] of uniqueFields) {
    const values = tools.map(getter);
    assert.equal(new Set(values).size, tools.length, `${name} should be unique for every tool page`);
  }
  for (const tool of tools) {
    assert.ok(tool.seo.title.includes(tool.name));
    assert.ok(tool.seo.description.length >= 80);
    assert.ok(tool.description.length >= 50);
    assert.ok(tool.about.length >= 120);
    assert.ok(tool.howItWorks.length >= 3);
    assert.ok(tool.commonErrors.length >= 3);
    assert.ok(tool.faq.length >= 2);
    assert.ok(tool.relatedTools.length > 0);
  }
});
test("invalid registries report missing relations and duplicate ids", () => {
  const copy = { ...tools[0], relatedTools: ["missing"] };
  const errors = validateRegistry([tools[0], copy]);
  assert.ok(errors.some(error => error.includes("Duplicate tool id")));
  assert.ok(errors.some(error => error.includes("Unknown related tool")));
});
