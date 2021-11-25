// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

import duplexify from "./duplexify.js";
import Readable from "./readable.js";
import Writable from "./writable.js";

Object.setPrototypeOf(Duplex.prototype, Readable.prototype);
Object.setPrototypeOf(Duplex, Readable);

{
  // Allow the keys array to be GC'ed.
  for (const method of Object.keys(Writable.prototype)) {
    if (!Duplex.prototype[method]) {
      Duplex.prototype[method] = Writable.prototype[method];
    }
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) {
    return new Duplex(options);
  }

  Readable.call(this, options);
  Writable.call(this, options);
  this.allowHalfOpen = true;

  if (options) {
    if (options.readable === false) {
      this.readable = false;
    }

    if (options.writable === false) {
      this.writable = false;
    }

    if (options.allowHalfOpen === false) {
      this.allowHalfOpen = false;
    }
  }
}

Object.defineProperties(Duplex.prototype, {
  writable: Object.getOwnPropertyDescriptor(Writable.prototype, "writable"),
  writableHighWaterMark: Object.getOwnPropertyDescriptor(
    Writable.prototype,
    "writableHighWaterMark",
  ),
  writableObjectMode: Object.getOwnPropertyDescriptor(
    Writable.prototype,
    "writableObjectMode",
  ),
  writableBuffer: Object.getOwnPropertyDescriptor(
    Writable.prototype,
    "writableBuffer",
  ),
  writableLength: Object.getOwnPropertyDescriptor(
    Writable.prototype,
    "writableLength",
  ),
  writableFinished: Object.getOwnPropertyDescriptor(
    Writable.prototype,
    "writableFinished",
  ),
  writableCorked: Object.getOwnPropertyDescriptor(
    Writable.prototype,
    "writableCorked",
  ),
  writableEnded: Object.getOwnPropertyDescriptor(
    Writable.prototype,
    "writableEnded",
  ),
  writableNeedDrain: Object.getOwnPropertyDescriptor(
    Writable.prototype,
    "writableNeedDrain",
  ),

  destroyed: {
    get() {
      if (
        this._readableState === undefined ||
        this._writableState === undefined
      ) {
        return false;
      }
      return this._readableState.destroyed && this._writableState.destroyed;
    },
    set(value) {
      // Backward compatibility, the user is explicitly
      // managing destroyed.
      if (this._readableState && this._writableState) {
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    },
  },
});

function _from(body) {
  return duplexify(body, "body");
}

Duplex.from = _from;

export default Duplex;
export { _from as from };
