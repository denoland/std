// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { Stream } from "./internal/streams/legacy.js";
import { isUint8Array } from "./_util/_util_types.ts";
import { Buffer } from "./buffer.ts";
import Duplex from "./internal/streams/duplex.js";
import Readable from "./internal/streams/readable.js";
import Writable from "./internal/streams/writable.js";

// const {
//   promisify: { custom: customPromisify },
// } = require("internal/util");
// const compose = require("internal/streams/compose");
// const { pipeline } = require("internal/streams/pipeline");
// const { destroyer } = require("internal/streams/destroy");
// const eos = require("internal/streams/end-of-stream");
// const { addAbortSignal } = require("internal/streams/add-abort-signal");
// const promises = require("stream/promises");

// Stream.isDisturbed = require("internal/streams/utils").isDisturbed;
Stream.Readable = Readable;
Stream.Writable = Writable;
Stream.Duplex = Duplex;
// Stream.Transform = require("internal/streams/transform");
// Stream.PassThrough = require("internal/streams/passthrough");
// Stream.pipeline = pipeline;
// Stream.addAbortSignal = addAbortSignal;
// Stream.finished = eos;
// Stream.destroy = destroyer;
// Stream.compose = compose;

// Object.defineProperty(Stream, "promises", {
//   configurable: true,
//   enumerable: true,
//   get() {
//     return promises;
//   },
// });

// Object.defineProperty(pipeline, customPromisify, {
//   enumerable: true,
//   get() {
//     return promises.pipeline;
//   },
// });

// Object.defineProperty(eos, customPromisify, {
//   enumerable: true,
//   get() {
//     return promises.finished;
//   },
// });

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(
    chunk.buffer,
    chunk.byteOffset,
    chunk.byteLength,
  );
}

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;
Stream._isUint8Array = isUint8Array;
Stream._uint8ArrayToBuffer = _uint8ArrayToBuffer;

export default Stream;
export {
  _uint8ArrayToBuffer,
  Duplex,
  isUint8Array as _isUint8Array,
  Readable,
  Stream,
  Writable,
};
