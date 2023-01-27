// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

// This module provides an interface to `Deno.core`. For environments
// that don't have access to `Deno.core` some APIs are polyfilled, while
// some are unavailble and throw on call.
// Note: deno_std shouldn't use Deno.core namespace. We should minimize these
// usages.

// deno-lint-ignore no-explicit-any
export let core: any;

// deno-lint-ignore no-explicit-any
const { Deno } = globalThis as any;

// @ts-ignore Deno.core is not defined in types
if (Deno?.[Deno.internal]?.core) {
  // @ts-ignore Deno[Deno.internal].core is not defined in types
  core = Deno[Deno.internal].core;
} else if (Deno?.core) {
  // @ts-ignore Deno.core is not defined in types
  core = Deno.core;
} else {
  core = {
    runMicrotasks() {
      throw new Error(
        "Deno.core.runMicrotasks() is not supported in this environment",
      );
    },
    setHasTickScheduled() {
      throw new Error(
        "Deno.core.setHasTickScheduled() is not supported in this environment",
      );
    },
    hasTickScheduled() {
      throw new Error(
        "Deno.core.hasTickScheduled() is not supported in this environment",
      );
    },
    setNextTickCallback: undefined,
    setMacrotaskCallback() {
      throw new Error(
        "Deno.core.setNextTickCallback() is not supported in this environment",
      );
    },
    evalContext(_code: string, _filename: string) {
      throw new Error(
        "Deno.core.evalContext is not supported in this environment",
      );
    },
    encode(chunk: string): Uint8Array {
      return new TextEncoder().encode(chunk);
    },
    eventLoopHasMoreWork(): boolean {
      return false;
    },
    isProxy(): boolean {
      return false;
    },
    getPromiseDetails(_promise: Promise<unknown>): [number, unknown] {
      throw new Error(
        "Deno.core.getPromiseDetails is not supported in this environment",
      );
    },
    setPromiseHooks() {
      throw new Error(
        "Deno.core.setPromiseHooks is not supported in this environment",
      );
    },
    ops: {
      op_napi_open(_filename: string) {
        throw new Error(
          "Node API is not supported in this environment",
        );
      },
    },
  };
}
