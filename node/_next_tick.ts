// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

import { validateCallback } from "./_validators.ts";
import { _exiting } from "./_process/process.ts";
import { FixedQueue } from "./_fixed_queue.ts";

// deno-lint-ignore no-explicit-any
const core = ((Deno as any).core as any);

interface Tock {
  callback: (...args: Array<unknown>) => void;
  args: Array<unknown>;
}

const queue = new FixedQueue();

function runNextTicks() {
  // FIXME(bartlomieju): Deno currently doesn't support
  // unhandled rejections
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
      // FIXME(bartlomieju): Deno currently doesn't support async hooks
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
        // FIXME(bartlomieju): Deno currently doesn't support async hooks
        // if (destroyHooksExist())
        // emitDestroy(asyncId);
      }

      // FIXME(bartlomieju): Deno currently doesn't support async hooks
      // emitAfter(asyncId);
    }
    core.runMicrotasks();
    // FIXME(bartlomieju): Deno currently doesn't support unhandled rejections
    // } while (!queue.isEmpty() || processPromiseRejections());
  } while (!queue.isEmpty());

  core.setHasTickScheduled(false);
  // FIXME(bartlomieju): Deno currently doesn't support async hooks
  // setHasRejectionToWarn(false);
}

core.setNextTickCallback(processTicksAndRejections);
core.setMacrotaskCallback(runNextTicks);
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
  validateCallback(callback);

  if (_exiting) {
    return;
  }

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
  // FIXME(bartlomieju): Deno currently doesn't support async hooks
  // const asyncId = newAsyncId();
  // const triggerAsyncId = getDefaultTriggerAsyncId();

  const tickObject = {
    // FIXME(bartlomieju): Deno currently doesn't support async hooks
    // [async_id_symbol]: asyncId,
    // [trigger_async_id_symbol]: triggerAsyncId,
    callback,
    args: args_,
  };

  // FIXME(bartlomieju): Deno currently doesn't support async hooks
  // if (initHooksExist())
  //   emitInit(asyncId, 'TickObject', triggerAsyncId, tickObject);

  queue.push(tickObject);
}
