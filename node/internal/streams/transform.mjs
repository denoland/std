// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file

import { ERR_METHOD_NOT_IMPLEMENTED } from "../errors.ts";
import * as process from "../../_process/process.ts";
import Duplex from "./duplex.mjs";

Object.setPrototypeOf(Transform.prototype, Duplex.prototype);
Object.setPrototypeOf(Transform, Duplex);

const kCallback = Symbol("kCallback");

function Transform(options) {
  if (!(this instanceof Transform)) {
    return new Transform(options);
  }

  Duplex.call(this, options);

  // We have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this[kCallback] = null;

  if (options) {
    if (typeof options.transform === "function") {
      this._transform = options.transform;
    }

    if (typeof options.flush === "function") {
      this._flush = options.flush;
    }
  }

  // When the writable side finishes, then flush out anything remaining.
  // Backwards compat. Some Transform streams incorrectly implement _final
  // instead of or in addition to _flush. By using 'prefinish' instead of
  // implementing _final we continue supporting this unfortunate use case.
  this.on("prefinish", prefinish);
}

function final(cb) {
  let called = false;
  if (typeof this._flush === "function" && !this.destroyed) {
    const result = this._flush((er, data) => {
      called = true;
      if (er) {
        if (cb) {
          cb(er);
        } else {
          this.destroy(er);
        }
        return;
      }

      if (data != null) {
        this.push(data);
      }
      this.push(null);
      if (cb) {
        cb();
      }
    });
    if (result !== undefined && result !== null) {
      try {
        const then = result.then;
        if (typeof then === "function") {
          then.call(
            result,
            (data) => {
              if (called) {
                return;
              }
              if (data != null) {
                this.push(data);
              }
              this.push(null);
              if (cb) {
                process.nextTick(cb);
              }
            },
            (err) => {
              if (cb) {
                process.nextTick(cb, err);
              } else {
                process.nextTick(() => this.destroy(err));
              }
            },
          );
        }
      } catch (err) {
        process.nextTick(() => this.destroy(err));
      }
    }
  } else {
    this.push(null);
    if (cb) {
      cb();
    }
  }
}

function prefinish() {
  if (this._final !== final) {
    final.call(this);
  }
}

Transform.prototype._final = final;

Transform.prototype._transform = function (chunk, encoding, callback) {
  throw new ERR_METHOD_NOT_IMPLEMENTED("_transform()");
};

Transform.prototype._write = function (chunk, encoding, callback) {
  const rState = this._readableState;
  const wState = this._writableState;
  const length = rState.length;

  let called = false;
  const result = this._transform(chunk, encoding, (err, val) => {
    called = true;
    if (err) {
      callback(err);
      return;
    }

    if (val != null) {
      this.push(val);
    }

    if (
      wState.ended || // Backwards compat.
      length === rState.length || // Backwards compat.
      rState.length < rState.highWaterMark ||
      rState.length === 0
    ) {
      callback();
    } else {
      this[kCallback] = callback;
    }
  });
  if (result !== undefined && result != null) {
    try {
      const then = result.then;
      if (typeof then === "function") {
        then.call(
          result,
          (val) => {
            if (called) {
              return;
            }

            if (val != null) {
              this.push(val);
            }

            if (
              wState.ended ||
              length === rState.length ||
              rState.length < rState.highWaterMark ||
              rState.length === 0
            ) {
              process.nextTick(callback);
            } else {
              this[kCallback] = callback;
            }
          },
          (err) => {
            process.nextTick(callback, err);
          },
        );
      }
    } catch (err) {
      process.nextTick(callback, err);
    }
  }
};

Transform.prototype._read = function () {
  if (this[kCallback]) {
    const callback = this[kCallback];
    this[kCallback] = null;
    callback();
  }
};

export default Transform;
