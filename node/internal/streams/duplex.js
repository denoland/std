// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

const {
  ObjectDefineProperties,
  ObjectGetOwnPropertyDescriptor,
  ObjectKeys,
  ObjectSetPrototypeOf,
} = primordials;

module.exports = Duplex;

const Readable = require("internal/streams/readable");
const Writable = require("internal/streams/writable");

ObjectSetPrototypeOf(Duplex.prototype, Readable.prototype);
ObjectSetPrototypeOf(Duplex, Readable);

{
  // Allow the keys array to be GC'ed.
  for (const method of ObjectKeys(Writable.prototype)) {
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

ObjectDefineProperties(Duplex.prototype, {
  writable: ObjectGetOwnPropertyDescriptor(Writable.prototype, "writable"),
  writableHighWaterMark: ObjectGetOwnPropertyDescriptor(
    Writable.prototype,
    "writableHighWaterMark",
  ),
  writableObjectMode: ObjectGetOwnPropertyDescriptor(
    Writable.prototype,
    "writableObjectMode",
  ),
  writableBuffer: ObjectGetOwnPropertyDescriptor(
    Writable.prototype,
    "writableBuffer",
  ),
  writableLength: ObjectGetOwnPropertyDescriptor(
    Writable.prototype,
    "writableLength",
  ),
  writableFinished: ObjectGetOwnPropertyDescriptor(
    Writable.prototype,
    "writableFinished",
  ),
  writableCorked: ObjectGetOwnPropertyDescriptor(
    Writable.prototype,
    "writableCorked",
  ),
  writableEnded: ObjectGetOwnPropertyDescriptor(
    Writable.prototype,
    "writableEnded",
  ),
  writableNeedDrain: ObjectGetOwnPropertyDescriptor(
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

let duplexify;

Duplex.from = function (body) {
  if (!duplexify) {
    duplexify = require("internal/streams/duplexify");
  }
  return duplexify(body, "body");
};
