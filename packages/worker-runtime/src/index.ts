import { MAX_EDITOR_INPUT_BYTES, type WorkerRequest, type WorkerResponse } from "@formatbase/tool-core";
import { getToolById } from "@formatbase/tool-registry";

type EngineResult = Pick<WorkerResponse, "ok" | "output" | "diagnostics">;
const bytes = (value: string) => new TextEncoder().encode(value).length;

async function dispatch(request: WorkerRequest): Promise<EngineResult> {
  const tool = getToolById(request.tool);
  if (!tool || tool.engine !== request.engine || !tool.operations.includes(request.action)) {
    return { ok: false, output: "", diagnostics: [{ severity: "error", code: "INVALID_REQUEST", message: "Unknown tool or operation." }] };
  }
  switch (tool.engine) {
    case "json": {
      const { runJson } = await import("@formatbase/json-engine");
      return runJson(request.input, request.action, request.options);
    }
    case "sql": {
      const { runSql } = await import("@formatbase/sql-engine");
      return runSql(request.input, request.options);
    }
    case "yaml": {
      const { runYaml } = await import("@formatbase/yaml-engine");
      return runYaml(request.input, request.action, request.options);
    }
    case "xml": {
      const { runXml } = await import("@formatbase/xml-engine");
      return runXml(request.input, request.action, request.options);
    }
    case "conversion": {
      const { runConversion } = await import("@formatbase/conversion-engine");
      return runConversion(request.tool, request.input, request.options);
    }
    default:
      return { ok: false, output: "", diagnostics: [{ severity: "error", code: "ENGINE_UNAVAILABLE", message: `${tool.engine} processing is not available yet.` }] };
  }
}

export async function executeRequest(request: WorkerRequest): Promise<WorkerResponse> {
  const started = performance.now();
  const inputBytes = bytes(request.input);
  if (inputBytes > MAX_EDITOR_INPUT_BYTES) return { requestId: request.requestId, ok: false, output: "", diagnostics: [{ severity: "error", code: "INPUT_TOO_LARGE", message: "Input exceeds the 3 MB safety limit." }], metrics: { durationMs: 0, inputBytes, outputBytes: 0 } };
  let result: EngineResult;
  try { result = await dispatch(request); }
  catch { result = { ok: false, output: "", diagnostics: [{ severity: "error", code: "ENGINE_ERROR", message: "The tool could not process this input." }] }; }
  return { requestId: request.requestId, ...result, metrics: { durationMs: Math.round(performance.now() - started), inputBytes, outputBytes: bytes(result.output) } };
}
