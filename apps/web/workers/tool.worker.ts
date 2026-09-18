import type { WorkerRequest, WorkerResponse } from "@codeformattools/tool-core";
import { executeRequest } from "@codeformattools/worker-runtime";

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const response: WorkerResponse = await executeRequest(event.data);
  self.postMessage(response);
};
