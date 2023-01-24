// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { ERR_ASYNC_TYPE, ERR_INVALID_ASYNC_ID } from "./internal/errors.ts";
import { validateFunction, validateString, validateObject } from "./internal/validators.mjs";
import { ERR_ASYNC_CALLBACK } from "./internal/errors.ts";
import { kEmptyObject } from "./internal/util.mjs";
import {
  // deno-lint-ignore camelcase
  async_id_symbol,
  destroyHooksExist,
  emitInit,
  enabledHooksExist,
  getDefaultTriggerAsyncId,
  hasAsyncIdStack,
  initHooksExist,
  newAsyncId,
  registerDestroyHook,
  executionAsyncResource,
  // deno-lint-ignore camelcase
  trigger_async_id_symbol,
  symbols,
  AsyncHook,
} from "./internal/async_hooks.ts";

const destroyedSymbol = Symbol("destroyed");

type AsyncResourceOptions = number | {
  triggerAsyncId?: number;
  requireManualDestroy?: boolean;
};

export class AsyncResource {
  [async_id_symbol]: number;
  [trigger_async_id_symbol]: number;
  [destroyedSymbol]!: { destroyed: boolean };

  constructor(type: string, opts: AsyncResourceOptions = {}) {
    validateString(type, "type");

    let triggerAsyncId: number;
    let requireManualDestroy = false;
    if (typeof opts !== "number") {
      triggerAsyncId = opts.triggerAsyncId === undefined
        ? getDefaultTriggerAsyncId()
        : opts.triggerAsyncId;
      requireManualDestroy = !!opts.requireManualDestroy;
    } else {
      triggerAsyncId = opts;
    }

    // Unlike emitInitScript, AsyncResource doesn't supports null as the
    // triggerAsyncId.
    if (!Number.isSafeInteger(triggerAsyncId) || triggerAsyncId < -1) {
      throw new ERR_INVALID_ASYNC_ID("triggerAsyncId", triggerAsyncId);
    }

    const asyncId = newAsyncId();
    this[async_id_symbol] = asyncId;
    this[trigger_async_id_symbol] = triggerAsyncId;

    if (initHooksExist()) {
      if (enabledHooksExist() && type.length === 0) {
        throw new ERR_ASYNC_TYPE(type);
      }

      emitInit(asyncId, type, triggerAsyncId, this);
    }

    if (!requireManualDestroy && destroyHooksExist()) {
      // This prop name (destroyed) has to be synchronized with C++
      const destroyed = { destroyed: false };
      this[destroyedSymbol] = destroyed;
      registerDestroyHook(this, asyncId, destroyed);
    }
  }

  runInAsyncScope(
    fn: (...args: unknown[]) => unknown,
    thisArg: unknown,
    ...args: unknown[]
  ) {
    // deno-lint-ignore no-unused-vars
    const asyncId = this[async_id_symbol];
    // TODO(kt3k): Uncomment the below
    // emitBefore(asyncId, this[trigger_async_id_symbol], this);

    try {
      const ret = Reflect.apply(fn, thisArg, args);

      return ret;
    } finally {
      if (hasAsyncIdStack()) {
        // TODO(kt3k): Uncomment the below
        // emitAfter(asyncId);
      }
    }
  }

  emitDestroy() {
    if (this[destroyedSymbol] !== undefined) {
      this[destroyedSymbol].destroyed = true;
    }
    // TODO(kt3k): Uncomment the below
    // emitDestroy(this[async_id_symbol]);
    return this;
  }

  asyncId() {
    return this[async_id_symbol];
  }

  triggerAsyncId() {
    return this[trigger_async_id_symbol];
  }

  bind(fn: (...args: unknown[]) => unknown, thisArg = this) {
    validateFunction(fn, "fn");
    const ret = this.runInAsyncScope.bind(
      this,
      fn,
      thisArg,
    );
    Object.defineProperties(ret, {
      "length": {
        configurable: true,
        enumerable: false,
        value: fn.length,
        writable: false,
      },
      "asyncResource": {
        configurable: true,
        enumerable: true,
        value: this,
        writable: true,
      },
    });
    return ret;
  }

  static bind(
    fn: (...args: unknown[]) => unknown,
    type: string | undefined,
    thisArg: AsyncResource | undefined,
  ) {
    type = type || fn.name;
    return (new AsyncResource(type || "bound-anonymous-fn")).bind(fn, thisArg);
  }
}

Deno.core.setPromiseHooks(() => {

});

export class AsyncLocalStorage {
  constructor(options = kEmptyObject) {
    validateObject(options, "options");

    this.kResourceStore = Symbol("kResourceStore");
  }

  run(store: any, callback: any, ...args: any) {
    // Avoid creation of an AsyncResource if store is already active
    if (Object.is(store, this.getStore())) {
      return Reflect.apply(callback, null, args);
    }

    const resource = executionAsyncResource();
    const oldStore = resource[this.kResourceStore];

    resource[this.kResourceStore] = store;

    try {
      return Reflect.apply(callback, null, args);
    } finally {
      resource[this.kResourceStore] = oldStore;
    }
  }

  exit(callback: (...args: unknown[]) => any, ...args: unknown[]) {
    this.run(undefined, callback, args);
  }

  getStore() {
    const resource = executionAsyncResource();
    return resource[this.kResourceStore];
  }
}

export function executionAsyncId() {
  return 1;
}

export function createHook(fns: any) {
  return new AsyncHook(fns);
}

// Placing all exports down here because the exported classes won't export
// otherwise.
export default {
  // Embedder API
  AsyncResource,
  executionAsyncId,
  createHook,
  AsyncLocalStorage,
};
