// This aliases are used in some node tests and represent a legacy alias
// for the stream modules
// deno-lint-ignore camelcase
import _stream_duplex from "./internal/streams/duplex.js";
// deno-lint-ignore camelcase
import _stream_passthrough from "./internal/streams/passthrough.js";
// deno-lint-ignore camelcase
import _stream_readable from "./internal/streams/readable.js";
// deno-lint-ignore camelcase
import _stream_transform from "./internal/streams/transform.js";
// deno-lint-ignore camelcase
import _stream_writable from "./internal/streams/writable.js";

import assert from "./assert.ts";
import assertStrict from "./assert/strict.ts";
import buffer from "./buffer.ts";
import childProcess from "./child_process.ts";
import console from "./console.ts";
import constants from "./constants.ts";
import crypto from "./crypto.ts";
import dgram from "./dgram.ts";
import dns from "./dns.ts";
import events from "./events.ts";
import fs from "./fs.ts";
import fsPromises from "./fs/promises.ts";
import internalFsUtils from "./internal/fs/utils.js";
import http from "./http.ts";
import inspector from "./inspector.ts";
import internalErrors from "./internal/errors.js";
import internalReadlineUtils from "./internal/readline/utils.js";
import internalStreamsAddAbortSignal from "./internal/streams/add-abort-signal.js";
import internalStreamsAddBufferList from "./internal/streams/buffer_list.js";
import internalTestBinding from "./internal/test/binding.ts";
import internalUtilInspect from "./internal/util/inspect.js";
import net from "./net.ts";
import os from "./os.ts";
import path from "./path.ts";
import perfHooks from "./perf_hooks.ts";
import process from "./process.ts";
import querystring from "./querystring.ts";
import readline from "./readline.ts";
import stream from "./stream.ts";
import streamConsumers from "./stream/consumers.js";
import streamPromises from "./stream/promises.js";
import streamWeb from "./stream/web.ts";
import stringDecoder from "./string_decoder.ts";
import sys from "./sys.ts";
import timers from "./timers.ts";
import timersPromises from "./timers/promises.ts";
import tty from "./tty.ts";
import url from "./url.ts";
import util from "./util.ts";
import vm from "./vm.ts";
import wasi from "./wasi.ts";

// TODO(kt3k): add these modules when implemented
// import cluster from "./cluster.ts";
// import http2 from "./http2.ts";
// import https from "./https.ts";
// import repl from "./repl.ts";
// import sys from "./sys.ts";
// import tls from "./tls.ts";
// import workerThreads from "./worker_threads.ts";
// import zlib from "./zlib.ts";

// Canonical mapping of supported modules
export default {
  _stream_duplex,
  _stream_passthrough,
  _stream_readable,
  _stream_transform,
  _stream_writable,
  assert,
  "assert/strict": assertStrict,
  buffer,
  crypto,
  console,
  constants,
  "child_process": childProcess,
  dgram,
  dns,
  events,
  fs,
  "fs/promises": fsPromises,
  http,
  inspector,
  "internal/errors": internalErrors,
  "internal/fs/utils": internalFsUtils,
  "internal/readline/utils": internalReadlineUtils,
  "internal/streams/add-abort-signal": internalStreamsAddAbortSignal,
  "internal/streams/buffer_list": internalStreamsAddBufferList,
  "internal/test/binding": internalTestBinding,
  "internal/util/inspect": internalUtilInspect,
  net,
  os,
  path,
  "perf_hooks": perfHooks,
  process,
  querystring,
  readline,
  stream,
  "stream/consumers": streamConsumers,
  "stream/promises": streamPromises,
  "stream/web": streamWeb,
  "string_decoder": stringDecoder,
  sys,
  timers,
  "timers/promises": timersPromises,
  tty,
  url,
  util,
  vm,
  zlib: {},
  wasi,
} as Record<string, unknown>;
