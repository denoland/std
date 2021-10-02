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

import { validateCallback, validateNumber } from "./_validators.ts";
import { ERR_OUT_OF_RANGE } from "./_errors.ts";
import { emitWarning } from "./process.ts";

export const kTimeout = Symbol("timeout");

// Timeout values > TIMEOUT_MAX are set to 1.
export const TIMEOUT_MAX = 2 ** 31 - 1;

class Timeout {
  #timeoutId: number;
  // deno-lint-ignore no-explicit-any
  #callback: any;
  #after: number;

  // deno-lint-ignore no-explicit-any
  constructor(callback: any, after: number) {
    this.#callback = callback;
    this.#after = after;
    this.#timeoutId = setTimeout(this.#callback, this.#after);
  }

  refresh() {
    clearTimeout(this.#timeoutId);
    this.#timeoutId = setTimeout(this.#callback, this.#after);
  }
}

// deno-lint-ignore no-explicit-any
export function setUnrefTimeout(callback: any, after: number) {
  // Type checking identical to setTimeout()
  validateCallback(callback);

  return new Timeout(callback, after);
}

export function getTimerDuration(msecs: number, name: string) {
  validateNumber(msecs, name);

  if (msecs < 0 || !Number.isFinite(msecs)) {
    throw new ERR_OUT_OF_RANGE(name, "a non-negative finite number", msecs);
  }

  // Ensure that msecs fits into signed int32
  if (msecs > TIMEOUT_MAX) {
    emitWarning(
      `${msecs} does not fit into a 32-bit signed integer.` +
        `\nTimer duration was truncated to ${TIMEOUT_MAX}.`,
      "TimeoutOverflowWarning",
    );

    return TIMEOUT_MAX;
  }

  return msecs;
}
