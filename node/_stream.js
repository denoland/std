// Copyright Joyent and Node contributors. All rights reserved. MIT license.

"use strict";

const {
  ObjectDefineProperty,
} = primordials;

const {
  promisify: { custom: customPromisify },
} = require("internal/util");

const compose = require("internal/streams/compose");
const { pipeline } = require("internal/streams/pipeline");
const { destroyer } = require("internal/streams/destroy");
const eos = require("internal/streams/end-of-stream");
const internalBuffer = require("internal/buffer");

const promises = require("stream/promises");

const Stream = module.exports = require("internal/streams/legacy").Stream;
Stream.isDisturbed = require("internal/streams/utils").isDisturbed;
Stream.Readable = require("internal/streams/readable");
Stream.Writable = require("internal/streams/writable");
Stream.Duplex = require("internal/streams/duplex");
Stream.Transform = require("internal/streams/transform");
Stream.PassThrough = require("internal/streams/passthrough");
Stream.pipeline = pipeline;
const { addAbortSignal } = require("internal/streams/add-abort-signal");
Stream.addAbortSignal = addAbortSignal;
Stream.finished = eos;
Stream.destroy = destroyer;
Stream.compose = compose;

ObjectDefineProperty(Stream, "promises", {
  configurable: true,
  enumerable: true,
  get() {
    return promises;
  },
});

ObjectDefineProperty(pipeline, customPromisify, {
  enumerable: true,
  get() {
    return promises.pipeline;
  },
});

ObjectDefineProperty(eos, customPromisify, {
  enumerable: true,
  get() {
    return promises.finished;
  },
});

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

Stream._isUint8Array = require("internal/util/types").isUint8Array;
Stream._uint8ArrayToBuffer = function _uint8ArrayToBuffer(chunk) {
  return new internalBuffer.FastBuffer(
    chunk.buffer,
    chunk.byteOffset,
    chunk.byteLength,
  );
};
