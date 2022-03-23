import {RegistryMetricCreator} from "../utils/registryMetricCreator";

export type IExecutionEngineMetrics = ReturnType<typeof createExecutionEngineMetrics>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
export function createExecutionEngineMetrics(register: RegistryMetricCreator) {
  return {
    executionEngineRequest: register.histogram<"method">({
      name: "execution_engine_request_seconds",
      help: "Requests to the execution layer",
      labelNames: ["method"],
    }),
    executionEngineRequestCount: register.gauge<"method">({
      name: "execution_engine_request_count",
      help: "Requests count to the execution layer",
      labelNames: ["method"],
    }),
  };
}
