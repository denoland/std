// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { basename } from "../path.ts";
import { EventEmitter } from "../events.ts";
import { notImplemented } from "../_utils.ts";
import { getValidatedPath } from "../internal/fs/utils.mjs";

export function asyncIterableIteratorToCallback<T>(
  iterator: AsyncIterableIterator<T>,
  callback: (val: T, done?: boolean) => void,
) {
  function next() {
    iterator.next().then((obj) => {
      if (obj.done) {
        callback(obj.value, true);
        return;
      }
      callback(obj.value);
      next();
    });
  }
  next();
}

export function asyncIterableToCallback<T>(
  iter: AsyncIterable<T>,
  callback: (val: T, done?: boolean) => void,
  errCallback: (e: unknown) => void,
) {
  const iterator = iter[Symbol.asyncIterator]();
  function next() {
    iterator.next().then((obj) => {
      if (obj.done) {
        callback(obj.value, true);
        return;
      }
      callback(obj.value);
      next();
    }, errCallback);
  }
  next();
}

type watchOptions = {
  persistent?: boolean;
  recursive?: boolean;
  encoding?: string;
};

type watchListener = (eventType: string, filename: string) => void;

export function watch(
  filename: string | URL,
  options: watchOptions,
  listener: watchListener,
): FSWatcher;
export function watch(
  filename: string | URL,
  listener: watchListener,
): FSWatcher;
export function watch(
  filename: string | URL,
  options: watchOptions,
): FSWatcher;
export function watch(filename: string | URL): FSWatcher;
export function watch(
  filename: string | URL,
  optionsOrListener?: watchOptions | watchListener,
  optionsOrListener2?: watchOptions | watchListener,
) {
  const listener = typeof optionsOrListener === "function"
    ? optionsOrListener
    : typeof optionsOrListener2 === "function"
    ? optionsOrListener2
    : undefined;
  const options = typeof optionsOrListener === "object"
    ? optionsOrListener
    : typeof optionsOrListener2 === "object"
    ? optionsOrListener2
    : undefined;

  const watchPath = getValidatedPath(filename).toString();

  let iterator: Deno.FsWatcher;
  // Start the actual watcher in the next event loop
  // to avoid error in compat test case (parallel/test-fs-watch.js)
  const timer = setTimeout(() => {
    iterator = Deno.watchFs(watchPath, {
      recursive: options?.recursive || false,
    });

    asyncIterableToCallback<Deno.FsEvent>(iterator, (val, done) => {
      if (done) return;
      fsWatcher.emit(
        "change",
        convertDenoFsEventToNodeFsEvent(val.kind),
        basename(val.paths[0]),
      );
    }, (e) => {
      fsWatcher.emit("error", e);
    });
  }, 0);

  const fsWatcher = new FSWatcher(() => {
    clearTimeout(timer);
    try {
      iterator?.close();
    } catch (e) {
      if (e instanceof Deno.errors.BadResource) {
        // already closed
        return;
      }
      throw e;
    }
  });

  if (listener) {
    fsWatcher.on("change", listener);
  }

  return fsWatcher;
}

export { watch as watchFile };

class FSWatcher extends EventEmitter {
  #closer: () => void;
  #closed = false;
  constructor(closer: () => void) {
    super();
    this.#closer = closer;
  }
  close() {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    this.emit("close");
    this.#closer();
  }
  ref() {
    notImplemented("FSWatcher.ref() is not implemented");
  }
  unref() {
    notImplemented("FSWatcher.unref() is not implemented");
  }
}

type NodeFsEventType = "rename" | "change";

function convertDenoFsEventToNodeFsEvent(
  kind: Deno.FsEvent["kind"],
): NodeFsEventType {
  if (kind === "create" || kind === "remove") {
    return "rename";
  } else {
    return "change";
  }
}
