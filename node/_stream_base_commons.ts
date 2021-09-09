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

import { ownerSymbol } from "./_async_hooks.ts";
import {
  kArrayBufferOffset,
  kReadBytesOrError,
  streamBaseState,
} from "./internal_binding/stream_wrap.ts";
import { isUint8Array } from "./_util/_util_types.ts";
import { errnoException } from "./_errors.ts";
import { FastBuffer } from "./_buffer.ts";
import { UV_EOF } from "./internal_binding/uv.ts";

export const kMaybeDestroy = Symbol("kMaybeDestroy");
export const kUpdateTimer = Symbol("kUpdateTimer");
export const kAfterAsyncWrite = Symbol("kAfterAsyncWrite");
export const kHandle = Symbol("kHandle");
export const kSession = Symbol("kSession");
export const kBuffer = Symbol("kBuffer");
export const kBufferGen = Symbol("kBufferGen");
export const kBufferCb = Symbol("kBufferCb");

// deno-lint-ignore no-explicit-any
export function onStreamRead(this: any, arrayBuffer: any) {
  const nread = streamBaseState[kReadBytesOrError];

  // deno-lint-ignore no-this-alias
  const handle = this;

  let stream = this[ownerSymbol];

  if (stream.constructor.name === "ReusedHandle") {
    stream = stream.handle;
  }

  stream[kUpdateTimer]();

  if (nread > 0 && !stream.destroyed) {
    let ret;
    let result;
    const userBuf = stream[kBuffer];
    if (userBuf) {
      result = (stream[kBufferCb](nread, userBuf) !== false);
      const bufGen = stream[kBufferGen];
      if (bufGen !== null) {
        const nextBuf = bufGen();
        if (isUint8Array(nextBuf)) {
          stream[kBuffer] = ret = nextBuf;
        }
      }
    } else {
      const offset = streamBaseState[kArrayBufferOffset];
      const buf = new FastBuffer(arrayBuffer, offset, nread);
      result = stream.push(buf);
    }
    if (!result) {
      handle.reading = false;
      if (!stream.destroyed) {
        const err = handle.readStop();
        if (err) {
          stream.destroy(errnoException(err, "read"));
        }
      }
    }

    return ret;
  }

  if (nread === 0) {
    return;
  }

  if (nread !== UV_EOF) {
    // CallJSOnreadMethod expects the return value to be a buffer.
    // Ref: https://github.com/nodejs/node/pull/34375
    stream.destroy(errnoException(nread, "read"));
    return;
  }

  // Defer this until we actually emit end
  if (stream._readableState.endEmitted) {
    if (stream[kMaybeDestroy]) {
      stream[kMaybeDestroy]();
    }
  } else {
    if (stream[kMaybeDestroy]) {
      stream.on("end", stream[kMaybeDestroy]);
    }

    if (handle.readStop) {
      const err = handle.readStop();
      if (err) {
        // CallJSOnreadMethod expects the return value to be a buffer.
        // Ref: https://github.com/nodejs/node/pull/34375
        stream.destroy(errnoException(err, "read"));
        return;
      }
    }

    // Push a null to signal the end of data.
    // Do it before `maybeDestroy` for correct order of events:
    // `end` -> `close`
    stream.push(null);
    stream.read(0);
  }
}
