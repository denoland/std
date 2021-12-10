// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { notImplemented } from "../_utils.ts";
import { inspect } from "./util/inspect.js";

// Timeout values > TIMEOUT_MAX are set to 1.
export const TIMEOUT_MAX = 2 ** 31 - 1;

export const kTimerId = Symbol("timerId");
const kRefed = Symbol("refed");

// Timer constructor function.
// The entire prototype is defined in lib/timers.js
export function Timeout(id) {
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
  notImplemented();
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
