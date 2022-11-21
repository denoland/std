// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { inspect } from "./util/inspect.mjs";
import { validateFunction, validateNumber } from "./validators.mjs";
import { ERR_OUT_OF_RANGE } from "./errors.ts";
import { emitWarning } from "../process.ts";

const setTimeout_ = globalThis.setTimeout;
const clearTimeout_ = globalThis.clearTimeout;
const setInterval_ = globalThis.setInterval;
const clearInterval_ = globalThis.clearInterval;

// Timeout values > TIMEOUT_MAX are set to 1.
export const TIMEOUT_MAX = 2 ** 31 - 1;

export const kTimerId = Symbol("timerId");
export const kTimeout = Symbol("timeout");
const kRefed = Symbol("refed");

// Timer constructor function.
export function Timeout(id, callback, after, args, isRepeat) {
  this._idleTimeout = after;
  this._onTimeout = callback;
  this._timerArgs = args;
  this._isRepeat = isRepeat;
  this[kTimerId] = id;
  this[kRefed] = true;
}

// Make sure the linked list only shows the minimal necessary information.
Timeout.prototype[inspect.custom] = function (_, options) {
  return inspect(this, {
    ...options,
    // Only inspect one level.
    depth: 0,
    // It should not recurse.
    customInspect: false,
  });
};

Timeout.prototype.refresh = function () {
  if (this._isRepeat) {
    clearInterval_(this[kTimerId]);
    this[kTimerId] = setInterval_(
      this._onTimeout,
      this._idleTimeout,
      ...this._timerArgs,
    );
  } else {
    clearTimeout_(this[kTimerId]);
    this[kTimerId] = setTimeout_(
      this._onTimeout,
      this._idleTimeout,
      ...this._timerArgs,
    );
  }
  return this;
};

Timeout.prototype.unref = function () {
  if (this[kRefed]) {
    this[kRefed] = false;
    Deno.unrefTimer(this[kTimerId]);
  }
  return this;
};

Timeout.prototype.ref = function () {
  if (!this[kRefed]) {
    this[kRefed] = true;
    Deno.refTimer(this[kTimerId]);
  }
  return this;
};

Timeout.prototype.hasRef = function () {
  return this[kRefed];
};

Timeout.prototype[Symbol.toPrimitive] = function () {
  return this[kTimerId];
};

/**
 * @param {number} msecs
 * @param {string} name
 * @returns
 */
export function getTimerDuration(msecs, name) {
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

export function setUnrefTimeout(cb, timeout, ...args) {
  validateFunction(cb, "callback");
  if (typeof timeout === "number" && timeout > TIMEOUT_MAX) {
    timeout = 1;
  }
  const callback = (...args) => {
    cb.bind(timer)(...args);
  };
  const timer = new Timeout(
    setTimeout_(callback, timeout, ...args),
    callback,
    timeout,
    args,
    false,
  );
  return timer.unref();
}

export default {
  getTimerDuration,
  kTimerId,
  kTimeout,
  setUnrefTimeout,
  Timeout,
  TIMEOUT_MAX,
};
