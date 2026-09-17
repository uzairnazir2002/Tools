import { performance } from "node:perf_hooks";
import { runJson } from "../../packages/json-engine/src/index.ts";

function sample(targetBytes) {
  const item = '{"id":9123372036854000123,"name":"sample","enabled":true}';
  const count = Math.max(1, Math.floor((targetBytes - 2) / (item.length + 1)));
  return `[${Array(count).fill(item).join(",")}]`;
}

for (const target of [100_000, 1_000_000, 3_000_000, 5_000_000]) {
  const input = sample(target);
  const start = performance.now();
  const result = runJson(input, "format", { indentation: 2 });
  const elapsed = Math.round(performance.now() - start);
  if (!result.ok) throw new Error(result.diagnostics[0]?.message || "Benchmark failed");
  console.log(JSON.stringify({ inputBytes: Buffer.byteLength(input), outputBytes: Buffer.byteLength(result.output), durationMs: elapsed, rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024) }));
}
