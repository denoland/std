// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { EventEmitter } from "./events.ts";
import { notImplemented } from "./_utils.ts";

const connectionSymbol = Symbol("connectionProperty");
const messageCallbacksSymbol = Symbol("messageCallbacks");
const nextIdSymbol = Symbol("nextId");
const onMessageSymbol = Symbol("onMessage");

type PrefixKeys<P extends string, T> = {
  [K in keyof T as K extends string ? `${P}.${K}` : never]: T[K];
};

// https://chromedevtools.github.io/devtools-protocol/v8/Console/
// deno-lint-ignore no-namespace
export namespace Console {
  export type LogLevel = "log" | "warning" | "error" | "debug" | "info";
  export type Source =
    | "xml"
    | "javascript"
    | "network"
    | "console-api"
    | "storage"
    | "appcache"
    | "rendering"
    | "security"
    | "other"
    | "deprecation"
    | "worker";
  export type ConsoleMessage = {
    source: Source;
    level: LogLevel;
    text: string;
    url?: string;
    line?: number;
    column?: number;
  };
  type _ConsoleListenerMap = {
    messageAdded: (message: ConsoleMessage) => void;
  };
  export type ConsoleListenerMap = PrefixKeys<"Console", _ConsoleListenerMap>;
}

// https://chromedevtools.github.io/devtools-protocol/v8/Debugger/
// deno-lint-ignore no-namespace
export namespace Debugger {
  export type ScopeType =
    | "global"
    | "local"
    | "with"
    | "closure"
    | "catch"
    | "block"
    | "script"
    | "eval"
    | "module"
    | "wasm-expression-stack";
  export type Scope = {
    type: ScopeType;
    object: Runtime.RemoteObject;
    name?: string;
    startLocation?: Location;
    endLocation?: Location;
  };
  export type CallFrameId = string;
  export type CallFrame = {
    callFrameId: CallFrameId;
    functionName: string;
    functionLocation?: Location;
    location: Location;
    /** @deprecated */
    url: string;
    scopeChain: Scope[];
    this: Runtime.RemoteObject;
    returnValue?: Runtime.RemoteObject;
    canBeRestarted: boolean;
  };
  export type DebugSymbolsType =
    | "None"
    | "SourceMap"
    | "EmbeddedDWARF"
    | "ExternalDWARF";
  export type DebugSymbols = {
    type: DebugSymbolsType;
    externalURL: string;
  };
  export type ScriptLanguage = "JavaScript" | "WebAssembly";
  export type BreakpointData = Record<string, unknown>; // Assumed from `object`
  export type BreakpointId = string;
  export type Reason =
    | "ambiguous"
    | "assert"
    | "CSPViolation"
    | "debugCommand"
    | "DOM"
    | "EventListener"
    | "exception"
    | "instrumentation"
    | "OOM"
    | "other"
    | "promiseRejection"
    | "XHR";
  export type DebuggerLocation = {
    scriptId: Runtime.ScriptId;
    lineNumber: number;
    columnNumber?: number;
  };
  type _DebuggerListenerMap = {
    breakpointResolved: (
      breakpointId: BreakpointId,
      location: DebuggerLocation,
    ) => void;
    paused: (
      callFrames: CallFrame[],
      reason: Reason,
      data?: BreakpointData,
      hitBreakpoints?: BreakpointId[],
      asyncStackTrace?: Runtime.StackTrace,
      asyncStackTraceId?: Runtime.StackTraceId,
      asyncCallStackTraceId?: never,
    ) => void;
    resumed: () => void;
    scriptFailedToParse: (
      scriptId: Runtime.ScriptId,
      url: string,
      startLine: number,
      startColumns: number,
      endLine: number,
      endColumns: number,
      executionContextId: Runtime.ExecutionContextId,
      hash: string,
      executionContextAuxData?: Runtime.ExecutionContextAuxData,
      sourceMapURL?: string,
      hasSourceURL?: boolean,
      isModule?: boolean,
      length?: number,
      stackTrace?: Runtime.StackTrace,
      codeOffset?: number,
      scriptLanguage?: ScriptLanguage,
      embedderName?: string,
    ) => void;
    scriptParsed: (
      scriptId: Runtime.ScriptId,
      url: string,
      startLine: number,
      startColumns: number,
      endLine: number,
      endColumns: number,
      executionContextId: Runtime.ExecutionContextId,
      hash: string,
      executionContextAuxData?: Runtime.ExecutionContextAuxData,
      isLiveEdit?: boolean,
      sourceMapURL?: string,
      hasSourceURL?: boolean,
      isModule?: boolean,
      length?: number,
      stackTrace?: Runtime.StackTrace,
      codeOffset?: number,
      scriptLanguage?: ScriptLanguage,
      debugSymbols?: DebugSymbols,
      embedderName?: string,
    ) => void;
  };
  export type DebuggerListenerMap = PrefixKeys<
    "Debugger",
    _DebuggerListenerMap
  >;
}
// https://chromedevtools.github.io/devtools-protocol/v8/HeapProfiler/
// deno-lint-ignore no-namespace
export namespace HeapProfiler {
  type FragmentIndex = number;
  type TotalObjectsCount = number;
  type TotalObjectsSize = number;
  type _HeapProfilerListenerMap = {
    addHeapSnapshotChunk: (chunk: string) => void;
    heapStatsUpdate: (
      statusUpdate: [FragmentIndex, TotalObjectsCount, TotalObjectsSize],
    ) => void;
    lastSeenObjectId: (lastSeenObjectId: number, timestamp: number) => void;
    reportHeapSnapshotProgress: (
      done: number,
      total: number,
      finished?: boolean,
    ) => void;
    resetProfiles: () => void;
  };
  export type HeapProfilerListenerMap = PrefixKeys<
    "HeapProfiler",
    _HeapProfilerListenerMap
  >;
}

// https://chromedevtools.github.io/devtools-protocol/v8/Profiler/
// deno-lint-ignore no-namespace
export namespace Profiler {
  type ProfileNodeId = number;
  type PositionTickInfo = {
    line: string;
    ticks: number;
  };
  type ProfileNode = {
    id: ProfileNodeId;
    callFrame: Runtime.CallFrame;
    hitCount?: number;
    children?: ProfileNodeId[];
    deoptReason?: string;
    positionTicks?: PositionTickInfo[];
  };
  type Profile = {
    nodes: ProfileNode[];
    startTime: number;
    endTime: number;
    samples?: number[];
    timeDeltas?: number[];
  };
  type CoverageRange = {
    startOffset: number;
    endOffset: number;
    count: number;
  };
  type FunctionCoverage = {
    functionName: string;
    ranges: CoverageRange[];
    isBlockCoverage: boolean;
  };
  type ScriptCoverage = {
    scriptId: Runtime.ScriptId;
    url: string;
    functions: FunctionCoverage[];
  };
  type _ProfilerListenerMap = {
    consoleProfileFinished: (
      id: string,
      location: Debugger.DebuggerLocation,
      profile: Profile,
      title?: string,
    ) => void;
    consoleProfileStarted: (
      id: string,
      location: Debugger.DebuggerLocation,
      title?: string,
    ) => void;
    preciseCoverageDeltaUpdate: (
      timestamp: number,
      occassion: string,
      result: ScriptCoverage,
    ) => void;
  };
  export type ProfilerListenerMap = PrefixKeys<
    "Profiler",
    _ProfilerListenerMap
  >;
}
// https://chromedevtools.github.io/devtools-protocol/v8/Runtime/
// deno-lint-ignore no-namespace
export namespace Runtime {
  export type CallType =
    | "log"
    | "debug"
    | "info"
    | "error"
    | "warning"
    | "dir"
    | "dirxml"
    | "table"
    | "trace"
    | "clear"
    | "startGroup"
    | "startGroupCollapsed"
    | "endGroup"
    | "assert"
    | "profile"
    | "profileEnd"
    | "count"
    | "timeEnd";
  export type Timestamp = number; // lol it is so inconsistent in those docs
  export type ScriptId = string;
  export type CallFrame = {
    functionName: string;
    scriptId: ScriptId;
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  export type ExecutionContextAuxData = Record<string, unknown>; // assumed from `object`
  export type ExecutionContextId = number;
  export type UnserializableValue = string;
  type UniqueDebuggerId = string;
  export type StackTrace = {
    description?: string;
    callFrames: Debugger.CallFrame[];
    parent?: StackTrace;
    stackTraceId: StackTraceId;
  };
  export type StackTraceId = {
    id: string;
    debuggerId: UniqueDebuggerId;
  };
  export type ObjectType =
    | "object"
    | "function"
    | "undefined"
    | "string"
    | "number"
    | "boolean"
    | "symbol"
    | "bigint";
  export type ObjectSubtype =
    | "array"
    | "null"
    | "node"
    | "regexp"
    | "date"
    | "map"
    | "set"
    | "weakmap"
    | "weakset"
    | "iterator"
    | "generator"
    | "error"
    | "proxy"
    | "promise"
    | "typedarray"
    | "arraybuffer"
    | "dataview"
    | "webassemblymemory"
    | "wasmvalue";
  export type WebDriverValueType =
    | "undefined"
    | "null"
    | "string"
    | "number"
    | "boolean"
    | "bigint"
    | "regexp"
    | "date"
    | "symbol"
    | "array"
    | "object"
    | "function"
    | "map"
    | "set"
    | "weakmap"
    | "weakset"
    | "error"
    | "proxy"
    | "promise"
    | "typedarray"
    | "arraybuffer"
    | "node"
    | "window";
  export type WebDriverValue = {
    type: WebDriverValueType;
    // Documentation calls it any
    value?: unknown;
    objectId?: string;
  };
  export type EntryPreview = {
    key?: ObjectPreview;
    value: ObjectPreview;
  };
  export type PropertyPreview = {
    name: string;
    type: ObjectType;
    subtype?: ObjectSubtype;
    value?: string;
    valuePreview?: ObjectPreview;
  };
  export type ObjectPreview = {
    type: ObjectType;
    subtype?: ObjectSubtype;
    description?: string;
    overflow: boolean;
    properties: PropertyPreview[];
    entries: EntryPreview[];
  };
  export type CustomPreview = {
    header: string;
    bodyGetterId?: RemoteObjectId;
  };
  export type RemoteObjectId = string;
  export type RemoteObject = {
    type: ObjectType;
    subtype?: ObjectSubtype;
    className?: string;
    // Documentation calls it any
    value?: unknown;
    unserializableValue?: UnserializableValue;
    description?: string;
    webDriverValue?: WebDriverValue;
    objectId?: RemoteObjectId;
    preview?: ObjectPreview;
    customPreview?: CustomPreview;
  };

  type _RuntimeListenerMap = {
    consoleAPICalled: (
      type: CallType,
      args: RemoteObject[],
      executionContextId: ExecutionContextId,
      timestamp: Timestamp,
      stackTrace?: StackTrace,
      context?: string,
    ) => void;
    exceptionRevoked: (reason: string, exceptionId: number) => void;
    executionContextDestroyed: (
      exectutionContextId: ExecutionContextId,
    ) => void;
    executionContextsCleared: () => void;
    // !!! type on `hints` in the next line is an assumption
    inspectRequested: (
      object: RemoteObject,
      hints: Record<string, unknown>,
      executionContextId?: ExecutionContextId,
    ) => void;
    bindingCalled: (
      name: string,
      payload: string,
      executionContextId: ExecutionContextId,
    ) => void;
  };
  export type RuntimeListenerMap = PrefixKeys<"Runtime", _RuntimeListenerMap>;
}

// https://chromedevtools.github.io/devtools-protocol/v8/Schema/
// By the empty type I mean that it was covered
// type SchemaListenerMap = { };

export type InspectorListenerMap =
  & Console.ConsoleListenerMap
  & Debugger.DebuggerListenerMap
  & HeapProfiler.HeapProfilerListenerMap
  & Profiler.ProfilerListenerMap
  & Runtime.RuntimeListenerMap;
// & SchemaListenerMap;

class Session extends EventEmitter<InspectorListenerMap> {
  [connectionSymbol]: null;
  [nextIdSymbol]: number;
  [messageCallbacksSymbol]: Map<string, (e: Error) => void>;

  constructor() {
    super();
    notImplemented("inspector.Session.prototype.constructor");
  }

  /** Connects the session to the inspector back-end. */
  connect() {
    notImplemented("inspector.Session.prototype.connect");
  }

  /** Connects the session to the main thread
   * inspector back-end. */
  connectToMainThread() {
    notImplemented("inspector.Session.prototype.connectToMainThread");
  }

  [onMessageSymbol](_message: string) {
    notImplemented("inspector.Session.prototype[Symbol('onMessage')]");
  }

  // TODO(duelsik): Add typings to post (docs look like it could be narrowed down to specific API spec)
  /** Posts a message to the inspector back-end. */
  post(
    _method: string,
    _params?: Record<string, unknown>,
    _callback?: (...args: unknown[]) => void,
  ): void {
    notImplemented("inspector.Session.prototype.post");
  }

  /** Immediately closes the session, all pending
   * message callbacks will be called with an
   * error.
   */
  disconnect() {
    notImplemented("inspector.Session.prototype.disconnect");
  }
}

/** Activates inspector on host and port.
 * See https://nodejs.org/api/inspector.html#inspectoropenport-host-wait */
function open(_port?: number, _host?: string, _wait?: boolean): void {
  notImplemented("inspector.Session.prototype.open");
}

/** Deactivate the inspector. Blocks until there are no active connections.
 * See https://nodejs.org/api/inspector.html#inspectorclose */
function close() {
  notImplemented("inspector.Session.prototype.close");
}

/** Return the URL of the active inspector, or undefined if there is none.
 * See https://nodejs.org/api/inspector.html#inspectorurl */
function url() {
  // TODO(kt3k): returns undefined for now, which means the inspector is not activated.
  return undefined;
}

/** Blocks until a client (existing or connected later) has sent Runtime.runIfWaitingForDebugger command.
 * See https://nodejs.org/api/inspector.html#inspectorwaitfordebugger */
function waitForDebugger() {
  notImplemented("inspector.wairForDebugger");
}

const console = globalThis.console;

export { close, console, open, Session, url, waitForDebugger };

export default {
  close,
  console,
  open,
  Session,
  url,
  waitForDebugger,
};
