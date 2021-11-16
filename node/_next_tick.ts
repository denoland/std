// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// FIXME(bartlomieju): currently this implementation is buggy
// See:
// - https://github.com/denoland/deno_std/issues/1482
// - https://github.com/denoland/deno/issues/12735

/** https://nodejs.org/api/process.html#process_process_nexttick_callback_args */

// import { validateCallback } from "./_validators.ts";

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

class FixedCircularBuffer<T> {
  bottom: number;
  top: number;
  list: undefined | Array<T>;
  next: FixedCircularBuffer<T> | null;

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

  push(data: T) {
    this.list![this.top] = data;
    this.top = (this.top + 1) & kMask;
  }

  shift() {
    const nextItem = this.list![this.bottom];
    if (nextItem === undefined) {
      return null;
    }
    // @ts-ignore FIXME(bartlomieju)
    this.list![this.bottom] = undefined;
    this.bottom = (this.bottom + 1) & kMask;
    return nextItem;
  }
}

interface Tock<T> {
  callback: (...args: Array<T>) => void;
  args: Array<T>;
}
class FixedQueue<T> {
  head: FixedCircularBuffer<T>;
  tail: FixedCircularBuffer<T>;

  constructor() {
    this.head = this.tail = new FixedCircularBuffer();
  }

  isEmpty() {
    return this.head.isEmpty();
  }

  push(data: T) {
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

const queue = new FixedQueue<Tock<unknown>>();

function runNextTicks() {
  // FIXME(bartlomieju):
  // if (!hasTickScheduled() && !hasRejectionToWarn())
  //   runMicrotasks();
  // if (!hasTickScheduled() && !hasRejectionToWarn())
  //   return;
  // @ts-ignore FIXME(bartlomieju)
  if (!Deno.core.hasTickScheduled()) {
    // @ts-ignore FIXME(bartlomieju)
    Deno.core.runMicrotasks();
  }
  // @ts-ignore FIXME(bartlomieju)
  if (!Deno.core.hasTickScheduled()) {
    return;
  }

  processTicksAndRejections();
}

function processTicksAndRejections() {
  let tock;
  do {
    while (tock = queue.shift()) {
      // FIXME(bartlomieju):
      // const asyncId = tock[async_id_symbol];
      // emitBefore(asyncId, tock[trigger_async_id_symbol], tock);

      try {
        const callback = tock.callback;
        if (tock.args === undefined) {
          callback();
        } else {
          const args = tock.args;
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
    // @ts-ignore FIXME(bartlomieju)
    Deno.core.runMicrotasks();
    // FIXME(bartlomieju):
    // } while (!queue.isEmpty() || processPromiseRejections());
  } while (!queue.isEmpty());
  // @ts-ignore FIXME(bartlomieju)
  Deno.core.setHasTickScheduled(false);
  // FIXME(bartlomieju):
  // setHasRejectionToWarn(false);
}

// @ts-ignore FIXME(bartlomieju)
Deno.core.setNextTickCallback(processTicksAndRejections);

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
  // validateCallback(callback);
  if (typeof callback !== "function") {
    throw new TypeError("expected callback to be a function");
    // throw new ERR_INVALID_CALLBACK(callback);
  }

  // FIXME(bartlomieju):
  // if (process._exiting)
  //   return;

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
    // @ts-ignore FIXME(bartlomieju)
    Deno.core.setHasTickScheduled(true);
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
  // @ts-ignore FIXME(bartlomieju)
  queue.push(tickObject);
}
