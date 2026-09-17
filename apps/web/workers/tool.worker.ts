import type { WorkerRequest, WorkerResponse } from "@formatbase/tool-core";
import { executeRequest } from "@formatbase/worker-runtime";

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const response: WorkerResponse = await executeRequest(event.data);
  self.postMessage(response);
};
