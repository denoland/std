/// <reference lib="deno.worker"/>

import { resolve, toFileUrl } from "../path/mod.ts";
import { notImplemented } from "./_utils.ts";
import { EventEmitter, GenericFunction, once } from "./events.ts";

let environmentData = new Map();
let threads = 0;

export interface WorkerOptions {
  // only for typings
  argv?: unknown[];
  env?: Record<string, unknown>;
  execArgv?: string[];
  stdin?: boolean;
  stdout?: boolean;
  stderr?: boolean;
  trackUnmanagedFds?: boolean;
  resourceLimits?: {
    maxYoungGenerationSizeMb?: number;
    maxOldGenerationSizeMb?: number;
    codeRangeSizeMb?: number;
    stackSizeMb?: number;
  };

  eval?: boolean;
  transferList?: Transferable[];
  workerData?: unknown;
}

const kHandle = Symbol("kHandle");
class _Worker extends EventEmitter {
  readonly threadId: number;
  readonly resourceLimits: Required<
    NonNullable<WorkerOptions["resourceLimits"]>
  > = {
    maxYoungGenerationSizeMb: -1,
    maxOldGenerationSizeMb: -1,
    codeRangeSizeMb: -1,
    stackSizeMb: 4,
  };
  private readonly [kHandle]: globalThis.Worker;

  postMessage: Worker["postMessage"];

  constructor(specifier: URL | string, options?: WorkerOptions) {
    super();
    if (options?.eval === true) {
      specifier = `data:text/javascript,${specifier}`;
    } else if (typeof specifier === "string") {
      specifier = toFileUrl(resolve(specifier));
    }
    const handle = this[kHandle] = new globalThis.Worker(
      specifier,
      {
        ...(options || {}),
        type: "module",
        // unstable
        deno: { namespace: true },
      },
    );
    handle.addEventListener(
      "error",
      (event) => this.emit("error", event.error || event.message),
    );
    handle.addEventListener(
      "messageerror",
      (event) => this.emit("messageerror", event.data),
    );
    handle.addEventListener(
      "message",
      (event) => this.emit("message", event.data),
    );
    handle.postMessage({
      environmentData,
      threadId: (this.threadId = ++threads),
      workerData: options?.workerData,
    }, options?.transferList || []);
    this.postMessage = handle.postMessage.bind(handle);
    this.emit("online");
  }

  terminate() {
    this[kHandle].terminate();
    this.emit("exit", 0);
  }

  readonly getHeapSnapshot = notImplemented;
  // fake performance
  readonly performance = globalThis.performance;
}

export const isMainThread = typeof DedicatedWorkerGlobalScope === "undefined" ||
  self instanceof DedicatedWorkerGlobalScope === false;

// fake resourceLimits
export const resourceLimits = isMainThread ? {} : {
  maxYoungGenerationSizeMb: 48,
  maxOldGenerationSizeMb: 2048,
  codeRangeSizeMb: 0,
  stackSizeMb: 4,
};

let threadId = 0;
let workerData: unknown = null;

// Like https://github.com/nodejs/node/blob/48655e17e1d84ba5021d7a94b4b88823f7c9c6cf/lib/internal/event_target.js#L611
interface NodeEventTarget extends
  Pick<
    EventEmitter,
    "eventNames" | "listenerCount" | "emit" | "removeAllListeners"
  > {
  setMaxListeners(n: number): void;
  getMaxListeners(): number;
  off(eventName: string, listener: GenericFunction): NodeEventTarget;
  on(eventName: string, listener: GenericFunction): NodeEventTarget;
  once(eventName: string, listener: GenericFunction): NodeEventTarget;
  addListener: NodeEventTarget["on"];
  removeListener: NodeEventTarget["off"];
}

type ParentPort =
  & DedicatedWorkerGlobalScope
  & typeof globalThis
  & NodeEventTarget;

// deno-lint-ignore no-explicit-any
let parentPort: ParentPort = null as any;

if (!isMainThread) {
  // deno-lint-ignore no-explicit-any
  const listeners = new WeakMap<GenericFunction, (ev: any) => any>();

  parentPort = self as ParentPort;
  parentPort.off = parentPort.removeListener = function (
    this: ParentPort,
    name,
    listener,
  ) {
    this.removeEventListener(name, listeners.get(listener)!);
    listeners.delete(listener);
    return this;
  };
  parentPort.on = parentPort.addListener = function (
    this: ParentPort,
    name,
    listener,
  ) {
    // deno-lint-ignore no-explicit-any
    const _listener = (ev: any) => listener(ev.data);
    listeners.set(listener, _listener);
    this.addEventListener(name, _listener);
    return this;
  };
  parentPort.once = function (this: ParentPort, name, listener) {
    // deno-lint-ignore no-explicit-any
    const _listener = (ev: any) => listener(ev.data);
    listeners.set(listener, _listener);
    this.addEventListener(name, _listener);
    return this;
  };

  // mocks
  parentPort.setMaxListeners = () => {};
  parentPort.getMaxListeners = () => Infinity;
  parentPort.eventNames = () => [""];
  parentPort.listenerCount = () => 0;

  parentPort.emit = () => notImplemented();
  parentPort.removeAllListeners = () => notImplemented();

  ([{ threadId, workerData, environmentData }] = await once(
    parentPort,
    "message",
  ));

  // alias
  parentPort.addEventListener("offline", () => parentPort.emit("close"));
}

export function getEnvironmentData(key: unknown) {
  return environmentData.get(key);
}

export function setEnvironmentData(key: unknown, value?: unknown) {
  if (value === undefined) {
    environmentData.delete(key);
  } else {
    environmentData.set(key, value);
  }
}

export const MessagePort = globalThis.MessagePort;
export const MessageChannel = globalThis.MessageChannel;
export const BroadcastChannel = globalThis.BroadcastChannel;
export const SHARE_ENV = Symbol.for("nodejs.worker_threads.SHARE_ENV");
export {
  _Worker as Worker,
  notImplemented as markAsUntransferable,
  notImplemented as moveMessagePortToContext,
  notImplemented as receiveMessageOnPort,
  parentPort,
  threadId,
  workerData,
};

export default {
  markAsUntransferable: notImplemented,
  moveMessagePortToContext: notImplemented,
  receiveMessageOnPort: notImplemented,
  MessagePort,
  MessageChannel,
  BroadcastChannel,
  Worker: _Worker,
  getEnvironmentData,
  setEnvironmentData,
  SHARE_ENV,
  threadId,
  workerData,
  resourceLimits,
  parentPort,
  isMainThread,
};
