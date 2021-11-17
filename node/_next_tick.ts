// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-inner-declarations

/** https://nodejs.org/api/process.html#process_process_nexttick_callback_args */

import { validateCallback } from "./_validators.ts";
// FIXME(bartlomieju):
// import { process } from "./process.ts";

// Currently optimal queue size, tested on V8 6.0 - 6.6. Must be power of two.
const kSize = 2048;
const kMask = kSize - 1;

// The FixedQueue is implemented as a singly-linked list of fixed-size
// circular buffers. It looks something like this:
//
//  head                                                       tail
//    |                                                          |
//    v                                                          v
// +-----------+ <-----\       +-----------+ <------\         +-----------+
// |  [null]   |        \----- |   next    |         \------- |   next    |
// +-----------+               +-----------+                  +-----------+
// |   item    | <-- bottom    |   item    | <-- bottom       |  [empty]  |
// |   item    |               |   item    |                  |  [empty]  |
// |   item    |               |   item    |                  |  [empty]  |
// |   item    |               |   item    |                  |  [empty]  |
// |   item    |               |   item    |       bottom --> |   item    |
// |   item    |               |   item    |                  |   item    |
// |    ...    |               |    ...    |                  |    ...    |
// |   item    |               |   item    |                  |   item    |
// |   item    |               |   item    |                  |   item    |
// |  [empty]  | <-- top       |   item    |                  |   item    |
// |  [empty]  |               |   item    |                  |   item    |
// |  [empty]  |               |  [empty]  | <-- top  top --> |  [empty]  |
// +-----------+               +-----------+                  +-----------+
//
// Or, if there is only one circular buffer, it looks something
// like either of these:
//
//  head   tail                                 head   tail
//    |     |                                     |     |
//    v     v                                     v     v
// +-----------+                               +-----------+
// |  [null]   |                               |  [null]   |
// +-----------+                               +-----------+
// |  [empty]  |                               |   item    |
// |  [empty]  |                               |   item    |
// |   item    | <-- bottom            top --> |  [empty]  |
// |   item    |                               |  [empty]  |
// |  [empty]  | <-- top            bottom --> |   item    |
// |  [empty]  |                               |   item    |
// +-----------+                               +-----------+
//
// Adding a value means moving `top` forward by one, removing means
// moving `bottom` forward by one. After reaching the end, the queue
// wraps around.
//
// When `top === bottom` the current queue is empty and when
// `top + 1 === bottom` it's full. This wastes a single space of storage
// but allows much quicker checks.

class FixedCircularBuffer {
  bottom: number;
  top: number;
  list: undefined | Array<unknown>;
  next: FixedCircularBuffer | null;

  constructor() {
    this.bottom = 0;
    this.top = 0;
    this.list = new Array(kSize);
    this.next = null;
  }

  isEmpty() {
    return this.top === this.bottom;
  }

  isFull() {
    return ((this.top + 1) & kMask) === this.bottom;
  }

  push(data: unknown) {
    this.list![this.top] = data;
    this.top = (this.top + 1) & kMask;
  }

  shift() {
    const nextItem = this.list![this.bottom];
    if (nextItem === undefined) {
      return null;
    }
    this.list![this.bottom] = undefined;
    this.bottom = (this.bottom + 1) & kMask;
    return nextItem;
  }
}

interface Tock {
  callback: (...args: Array<unknown>) => void;
  args: Array<unknown>;
}
class FixedQueue {
  head: FixedCircularBuffer;
  tail: FixedCircularBuffer;

  constructor() {
    this.head = this.tail = new FixedCircularBuffer();
  }

  isEmpty() {
    return this.head.isEmpty();
  }

  push(data: unknown) {
    if (this.head.isFull()) {
      // Head is full: Creates a new queue, sets the old queue's `.next` to it,
      // and sets it as the new main queue.
      this.head = this.head.next = new FixedCircularBuffer();
    }
    this.head.push(data);
  }

  shift() {
    const tail = this.tail;
    const next = tail.shift();
    if (tail.isEmpty() && tail.next !== null) {
      // If there is another queue, it forms the new tail.
      this.tail = tail.next;
    }
    return next;
  }
}

const queue = new FixedQueue();

// deno-lint-ignore no-explicit-any
let _nextTick: any;

// @ts-ignore Deno.core is not defined in types
if (Deno?.core?.setNextTickCallback) {
  // deno-lint-ignore no-explicit-any
  const core = ((Deno as any).core as any);

  function runNextTicks() {
    // FIXME(bartlomieju):
    // if (!hasTickScheduled() && !hasRejectionToWarn())
    //   runMicrotasks();
    // if (!hasTickScheduled() && !hasRejectionToWarn())
    //   return;
    if (!core.hasTickScheduled()) {
      core.runMicrotasks();
    }
    if (!core.hasTickScheduled()) {
      return true;
    }

    processTicksAndRejections();
    return true;
  }

  function processTicksAndRejections() {
    let tock;
    do {
      // deno-lint-ignore no-cond-assign
      while (tock = queue.shift()) {
        // FIXME(bartlomieju):
        // const asyncId = tock[async_id_symbol];
        // emitBefore(asyncId, tock[trigger_async_id_symbol], tock);

        try {
          const callback = (tock as Tock).callback;
          if ((tock as Tock).args === undefined) {
            callback();
          } else {
            const args = (tock as Tock).args;
            switch (args.length) {
              case 1:
                callback(args[0]);
                break;
              case 2:
                callback(args[0], args[1]);
                break;
              case 3:
                callback(args[0], args[1], args[2]);
                break;
              case 4:
                callback(args[0], args[1], args[2], args[3]);
                break;
              default:
                callback(...args);
            }
          }
        } finally {
          // FIXME(bartlomieju):
          // if (destroyHooksExist())
          // emitDestroy(asyncId);
        }

        // FIXME(bartlomieju):
        // emitAfter(asyncId);
      }
      core.runMicrotasks();
      // FIXME(bartlomieju):
      // } while (!queue.isEmpty() || processPromiseRejections());
    } while (!queue.isEmpty());
    core.setHasTickScheduled(false);
    // FIXME(bartlomieju):
    // setHasRejectionToWarn(false);
  }

  core.setNextTickCallback(processTicksAndRejections);
  core.setMacrotaskCallback(runNextTicks);

  function __nextTickNative<T extends Array<unknown>>(
    this: unknown,
    callback: (...args: T) => void,
    ...args: T
  ) {
    validateCallback(callback);

    // FIXME(bartlomieju):
    // if (process._exiting) {
    //   return;
    // }

    // TODO(bartlomieju): seems superfluous if we don't depend on `arguments`
    let args_;
    switch (args.length) {
      case 0:
        break;
      case 1:
        args_ = [args[0]];
        break;
      case 2:
        args_ = [args[0], args[1]];
        break;
      case 3:
        args_ = [args[0], args[1], args[2]];
        break;
      default:
        args_ = new Array(args.length);
        for (let i = 0; i < args.length; i++) {
          args_[i] = args[i];
        }
    }

    if (queue.isEmpty()) {
      core.setHasTickScheduled(true);
    }
    // FIXME(bartlomieju):
    // const asyncId = newAsyncId();
    // const triggerAsyncId = getDefaultTriggerAsyncId();
    const tickObject = {
      // [async_id_symbol]: asyncId,
      // [trigger_async_id_symbol]: triggerAsyncId,
      callback,
      args: args_,
    };
    // if (initHooksExist())
    //   emitInit(asyncId, 'TickObject', triggerAsyncId, tickObject);
    queue.push(tickObject);
  }
  _nextTick = __nextTickNative;
} else {
  function __nextTickQueueMicrotask<T extends Array<unknown>>(
    this: unknown,
    callback: (...args: T) => void,
    ...args: T
  ) {
    if (args) {
      queueMicrotask(() => callback.call(this, ...args));
    } else {
      queueMicrotask(callback);
    }
  }

  _nextTick = __nextTickQueueMicrotask;
}

// `nextTick()` will not enqueue any callback when the process is about to
// exit since the callback would not have a chance to be executed.
export function nextTick(this: unknown, callback: () => void): void;
export function nextTick<T extends Array<unknown>>(
  this: unknown,
  callback: (...args: T) => void,
  ...args: T
): void;
export function nextTick<T extends Array<unknown>>(
  this: unknown,
  callback: (...args: T) => void,
  ...args: T
) {
  _nextTick(callback, ...args);
}
