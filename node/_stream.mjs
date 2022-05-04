// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { _uint8ArrayToBuffer } from "./internal/streams/_utils.ts";
import { addAbortSignal } from "./internal/streams/add-abort-signal.mjs";
import { destroyer } from "./internal/streams/destroy.mjs";
import { isDisturbed } from "./internal/streams/utils.mjs";
import { isUint8Array } from "./internal/util/types.ts";
import { pipeline } from "./internal/streams/pipeline.mjs";
import { promisify } from "./internal/util.mjs";
import { Stream } from "./internal/streams/legacy.mjs";
import compose from "./internal/streams/compose.mjs";
import Duplex from "./internal/streams/duplex.mjs";
import eos from "./internal/streams/end-of-stream.mjs";
import PassThrough from "./internal/streams/passthrough.mjs";
import promises from "./stream/promises.mjs";
import Readable from "./internal/streams/readable.mjs";
import Transform from "./internal/streams/transform.mjs";
import Writable from "./internal/streams/writable.mjs";

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
