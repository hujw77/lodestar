import {IChainForkConfig} from "@chainsafe/lodestar-config";
import {IExecutionEngine, IExecutionBuilder} from "./interface.js";
import {ExecutionEngineDisabled} from "./disabled.js";
import {ExecutionEngineHttp, ExecutionEngineHttpOpts, defaultExecutionEngineHttpOpts} from "./http.js";
import {ExecutionEngineMock, ExecutionEngineMockOpts} from "./mock.js";

import {ExecutionBuilderHttp, ExecutionBuilderHttpOpts, defaultExecutionBuilderHttpOpts} from "./builder.js";
export {
  IExecutionEngine,
  ExecutionEngineHttp,
  ExecutionEngineDisabled,
  ExecutionEngineMock,
  IExecutionBuilder,
  ExecutionBuilderHttp,
  defaultExecutionEngineHttpOpts,
};

export type ExecutionEngineOpts =
  | ({mode?: "http"} & ExecutionEngineHttpOpts)
  | ({mode: "mock"} & ExecutionEngineMockOpts)
  | {mode: "disabled"};

export const defaultExecutionEngineOpts: ExecutionEngineOpts = defaultExecutionEngineHttpOpts;

export type ExecutionBuilderOpts = {mode?: "http"} & ExecutionBuilderHttpOpts;
export const defaultExecutionBuilderOpts: ExecutionBuilderOpts = defaultExecutionBuilderHttpOpts;

export function initializeExecutionEngine(opts: ExecutionEngineOpts, signal: AbortSignal): IExecutionEngine {
  switch (opts.mode) {
    case "mock":
      return new ExecutionEngineMock(opts);
    case "disabled":
      return new ExecutionEngineDisabled();
    case "http":
    default:
      return new ExecutionEngineHttp(opts, signal);
  }
}

export function initializeExecutionBuilder(opts: ExecutionBuilderOpts, config: IChainForkConfig): IExecutionBuilder {
  switch (opts.mode) {
    case "http":
    default:
      return new ExecutionBuilderHttp(opts, config);
  }
}
