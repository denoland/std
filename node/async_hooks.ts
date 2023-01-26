// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { ERR_ASYNC_TYPE, ERR_INVALID_ASYNC_ID } from "./internal/errors.ts";
import {
  validateFunction,
  validateObject,
  validateString,
} from "./internal/validators.mjs";
import { ERR_ASYNC_CALLBACK } from "./internal/errors.ts";
import { kEmptyObject } from "./internal/util.mjs";
import {
  // deno-lint-ignore camelcase
  async_id_symbol,
  AsyncHook,
  destroyHooksExist,
  emitInit,
  enabledHooksExist,
  executionAsyncResource,
  getDefaultTriggerAsyncId,
  hasAsyncIdStack,
  initHooksExist,
  newAsyncId,
  registerDestroyHook,
  symbols,
  // deno-lint-ignore camelcase
  trigger_async_id_symbol,
} from "./internal/async_hooks.ts";

function assert(cond: boolean) {
  if (!cond) throw new Error("boom!");
}
const asyncContextStack: AsyncContextFrame[] = [];

function pushAsyncFrame(frame: AsyncContextFrame) {
  asyncContextStack.push(frame);
}

function popAsyncFrame() {
  assert(asyncContextStack.length > 0);
  asyncContextStack.pop();
}

let rootAsyncFrame: AsyncContextFrame | undefined = undefined;
let asyncContextTrackingEnabled = false;

const asyncContext = Symbol("asyncContext");
function isRejected(promise: Promise<unknown>) {
  const [state] = Deno[Deno.internal].core.getPromiseDetails(promise);
  return state == 2;
}

function setAsyncContextTrackingEnabled() {
  if (asyncContextTrackingEnabled) {
    return;
  }
  asyncContextTrackingEnabled = true;

  Deno[Deno.internal].core.setPromiseHooks((promise: Promise<unknown>) => {
    const currentFrame = AsyncContextFrame.current();
    if (!currentFrame.isRoot()) {
      assert(AsyncContextFrame.tryGetContext(promise) == null);
      AsyncContextFrame.attachContext(promise);
    }
  }, (promise: Promise<unknown>) => {
    const maybeFrame = AsyncContextFrame.tryGetContext(promise);
    if (maybeFrame) {
      pushAsyncFrame(maybeFrame);
    } else {
      pushAsyncFrame(AsyncContextFrame.getRootAsyncContext());
    }
  }, (promise: Promise<unknown>) => {
    popAsyncFrame();

    if (!isRejected(promise)) {
      delete promise[asyncContext];
    }
  }, (promise: Promise<unknown>) => {
    const currentFrame = AsyncContextFrame.current();
    if (!currentFrame.isRoot() && isRejected(promise) && AsyncContextFrame.tryGetContext(promise) == null) {
      AsyncContextFrame.attachContext(promise);
    }
  });
}

class AsyncContextFrame {
  storage: StorageEntry[];
  constructor(
    maybeParent?: AsyncContextFrame | null,
    maybeStorageEntry?: StorageEntry | null,
    isRoot = false,
  ) {
    this.storage = [];

    setAsyncContextTrackingEnabled();

    const propagate = (parent: AsyncContextFrame) => {
      parent.storage = parent.storage.filter((entry) => !entry.key.isDead());
      parent.storage.forEach((entry) => this.storage.push(entry));

      if (maybeStorageEntry) {
        const existingEntry = this.storage.find((entry) =>
          entry.key === maybeStorageEntry.key
        );
        if (existingEntry) {
          existingEntry.value = maybeStorageEntry.value;
        } else {
          this.storage.push(maybeStorageEntry);
        }
      }
    };

    if (!isRoot) {
      if (maybeParent) {
        propagate(maybeParent);
      } else {
        propagate(AsyncContextFrame.current());
      }
    }
  }

  static tryGetContext(promise: Promise<unknown>) {
    return promise[asyncContext];
  }

  static attachContext(promise: Promise<unknown>) {
    assert(!(asyncContext in promise));
    const frame = AsyncContextFrame.current();
    promise[asyncContext] = frame;
  }

  static getRootAsyncContext() {
    if (typeof rootAsyncFrame !== "undefined") {
      return rootAsyncFrame;
    }

    rootAsyncFrame = new AsyncContextFrame(null, null, true);
    return rootAsyncFrame;
  }

  static current() {
    if (asyncContextStack.length === 0) {
      return AsyncContextFrame.getRootAsyncContext();
    }

    return asyncContextStack[asyncContextStack.length - 1];
  }

  static create(
    maybeParent?: AsyncContextFrame | null,
    maybeStorageEntry?: StorageEntry | null,
  ) {
    return new AsyncContextFrame(maybeParent, maybeStorageEntry);
  }

  static wrap(
    fn: () => unknown,
    maybeFrame: AsyncContextFrame | undefined,
    thisArg: any,
  ) {
    return (...args: any) => {
      const frame = maybeFrame || AsyncContextFrame.current();
      Scope.enter(frame);
      try {
        return fn.apply(thisArg, args);
      } finally {
        Scope.exit();
      }
    };
  }

  get(key: StorageKey) {
    assert(!key.isDead());
    this.storage = this.storage.filter((entry) => !entry.key.isDead());
    const entry = this.storage.find((entry) => entry.key === key);
    if (entry) {
      return entry.value;
    }
    return undefined;
  }

  static pop() {
    throw new Error("not implemented");
  }

  isRoot() {
    return AsyncContextFrame.getRootAsyncContext() == this;
  }

  static pushAsyncFrame() {
    throw new Error("not implemented");
  }
}

const destroyedSymbol = Symbol("destroyed");

type AsyncResourceOptions = number | {
  triggerAsyncId?: number;
  requireManualDestroy?: boolean;
};

export class AsyncResource {
  frame: AsyncContextFrame;
  constructor(type: string, opts: AsyncResourceOptions = {}) {
    this.frame = AsyncContextFrame.current();
  }

  runInAsyncScope(
    fn: (...args: unknown[]) => unknown,
    thisArg: unknown,
    ...args: unknown[]
  ) {
    Scope.enter(this.frame);

    try {
      return fn.apply(thisArg, args);
    } finally {
      Scope.exit();
    }
  }

  bind(fn: (...args: unknown[]) => unknown, thisArg = this) {
    validateFunction(fn, "fn");
    const frame = AsyncContextFrame.current();
    const bound = AsyncContextFrame.wrap(fn, frame, thisArg);

    Object.defineProperties(bound, {
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
    return bound;
  }

  static bind(
    fn: (...args: unknown[]) => unknown,
    type: string | undefined,
    thisArg: AsyncResource | undefined,
  ) {
    console.log("AsyncResource.bind", fn, type, thisArg);
    type = type || fn.name;
    return (new AsyncResource(type || "AsyncResource")).bind(fn, thisArg);
  }
}

class Scope {
  static enter(maybeFrame?: AsyncContextFrame) {
    if (maybeFrame) {
      pushAsyncFrame(maybeFrame);
    } else {
      pushAsyncFrame(AsyncContextFrame.getRootAsyncContext());
    }
  }

  static exit() {
    popAsyncFrame();
  }
}

class StorageEntry {
  key: StorageKey;
  value: unknown;
  constructor(key: StorageKey, value: unknown) {
    this.key = key;
    this.value = value;
  }
}

class StorageScope {
  frame: AsyncContextFrame;
  constructor(key: StorageKey, store: unknown) {
    this.frame = AsyncContextFrame.create(null, new StorageEntry(key, store));
    Scope.enter(this.frame);
  }

  static exit() {
    Scope.exit();
  }
}

class StorageKey {
  #dead = false;

  reset() {
    this.#dead = true;
  }

  isDead() {
    return this.#dead;
  }
}

const fnReg = new FinalizationRegistry((val: StorageKey) => {
  val.reset();
});
export class AsyncLocalStorage {
  #key;

  constructor(options = kEmptyObject) {
    this.#key = new StorageKey();
    fnReg.register(this, this.#key);
  }

  run(store: any, callback: any, ...args: any) {
    console.log("AsyncLocalStorage run", store);
    const _scope = new StorageScope(this.#key, store);
    const res = callback(...args);
    Scope.exit();
    return res;
  }

  exit(callback: (...args: unknown[]) => any, ...args: unknown[]) {
    return this.run(undefined, callback, args);
  }

  getStore() {
    console.log("getStore");
    const currentFrame = AsyncContextFrame.current();
    console.log("getStore currentFrame", currentFrame);
    const value = currentFrame.get(this.#key);

    console.log("getStore value", value);
    return value;
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
