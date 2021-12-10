// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-var
import processModule from "./process.ts";
import { Buffer as bufferModule } from "./buffer.ts";
import timers from "./timers.ts";

type GlobalType = {
  process: typeof processModule;
  Buffer: typeof bufferModule;
  setTimeout: typeof timers.setTimeout;
  clearTimeout: typeof timers.clearTimeout;
  setInterval: typeof timers.setInterval;
  clearInterval: typeof timers.clearInterval;
  setImmediate: typeof timers.setImmediate;
  clearImmediate: typeof timers.clearImmediate;
};

declare global {
  interface Window {
    global: GlobalType;
  }

  interface globalThis {
    global: GlobalType;
  }

  var global: GlobalType;
  var process: typeof processModule;
  var Buffer: typeof bufferModule;
  type Buffer = bufferModule;
  var setImmediate: typeof timers.setImmediate;
  var clearImmediate: typeof timers.clearImmediate;
}

Object.defineProperty(globalThis, "global", {
  value: globalThis,
  writable: false,
  enumerable: false,
  configurable: true,
});

Object.defineProperty(globalThis, "process", {
  value: processModule,
  enumerable: false,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "Buffer", {
  value: bufferModule,
  enumerable: false,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "setTimeout", {
  value: timers.setTimeout,
  enumerable: true,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "clearTimeout", {
  value: timers.clearTimeout,
  enumerable: true,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "setInterval", {
  value: timers.setInterval,
  enumerable: true,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "clearInterval", {
  value: timers.clearInterval,
  enumerable: true,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "setImmediate", {
  value: timers.setImmediate,
  enumerable: true,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "clearImmediate", {
  value: timers.clearImmediate,
  enumerable: true,
  writable: true,
  configurable: true,
});

export {};
