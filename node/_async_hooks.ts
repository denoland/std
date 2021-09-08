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

import * as asyncWrap from "./internal_binding/async_wrap.ts";

export { asyncIdSymbol, ownerSymbol } from "./internal_binding/symbols.ts";

// Each constant tracks how many callbacks there are for any given step of
// async execution. These are tracked so if the user didn't include callbacks
// for a given step, that step can bail out early.
const { kAsyncIdCounter, kDefaultTriggerAsyncId } = asyncWrap.constants;

/**
 * `asyncIdFields` is a `Float64Array`. Each index
 * contains the ids for the various asynchronous states of the application.
 * These are:
 *
 * - `kAsyncIdCounter`: Incremental counter tracking the next assigned asyncId.
 */
const { asyncIdFields } = asyncWrap;

// Increment the internal id counter and return the value.
export function newAsyncId() {
  return ++asyncIdFields[kAsyncIdCounter];
}

export function defaultTriggerAsyncIdScope(
  triggerAsyncId: number,
  // deno-lint-ignore ban-types
  block: Function,
  // deno-lint-ignore  no-explicit-any
  ...args: any[]
) {
  if (triggerAsyncId === undefined) {
    return block.apply(null, args);
  }

  // CHECK(NumberIsSafeInteger(triggerAsyncId))
  // CHECK(triggerAsyncId > 0)
  const oldDefaultTriggerAsyncId = asyncIdFields[kDefaultTriggerAsyncId];
  asyncIdFields[kDefaultTriggerAsyncId] = triggerAsyncId;

  try {
    return block.apply(null, args);
  } finally {
    asyncIdFields[kDefaultTriggerAsyncId] = oldDefaultTriggerAsyncId;
  }
}
