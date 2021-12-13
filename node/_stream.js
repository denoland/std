// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { _uint8ArrayToBuffer } from "./internal/streams/_utils.ts";
import { addAbortSignal } from "./internal/streams/add-abort-signal.js";
import { destroyer } from "./internal/streams/destroy.js";
import { isDisturbed } from "./internal/streams/utils.js";
import { isUint8Array } from "./internal/util/types.ts";
import { pipeline } from "./internal/streams/pipeline.js";
import { promisify } from "./internal/util.js";
import { Stream } from "./internal/streams/legacy.js";
import compose from "./internal/streams/compose.js";
import Duplex from "./internal/streams/duplex.js";
import eos from "./internal/streams/end-of-stream.js";
import PassThrough from "./internal/streams/passthrough.js";
import promises from "./stream/promises.js";
import Readable from "./internal/streams/readable.js";
import Transform from "./internal/streams/transform.js";
import Writable from "./internal/streams/writable.js";

const { custom: customPromisify } = promisify;

Stream.isDisturbed = isDisturbed;
Stream.Readable = Readable;
Stream.Writable = Writable;
Stream.Duplex = Duplex;
Stream.Transform = Transform;
Stream.PassThrough = PassThrough;
Stream.pipeline = pipeline;
Stream.addAbortSignal = addAbortSignal;
Stream.finished = eos;
Stream.destroy = destroyer;
Stream.compose = compose;

Object.defineProperty(Stream, "promises", {
  configurable: true,
  enumerable: true,
  get() {
    return promises;
  },
});

Object.defineProperty(pipeline, customPromisify, {
  enumerable: true,
  get() {
    return promises.pipeline;
  },
});

Object.defineProperty(eos, customPromisify, {
  enumerable: true,
  get() {
    return promises.finished;
  },
});

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;
Stream._isUint8Array = isUint8Array;
Stream._uint8ArrayToBuffer = _uint8ArrayToBuffer;

export default Stream;
export {
  _uint8ArrayToBuffer,
  addAbortSignal,
  compose,
  destroyer as destroy,
  Duplex,
  eos as finished,
  isDisturbed,
  isUint8Array as _isUint8Array,
  PassThrough,
  pipeline,
  Readable,
  Stream,
  Transform,
  Writable,
};
