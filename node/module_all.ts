import assert from "./assert.ts";
import assertStrict from "./assert/strict.ts";
import buffer from "./buffer.ts";
import childProcess from "./child_process.ts";
import console from "./console.ts";
import constants from "./constants.ts";
import crypto from "./crypto.ts";
import dns from "./dns.ts";
import events from "./events.ts";
import fs from "./fs.ts";
import fsPromises from "./fs/promises.ts";
import http from "./http.ts";
import net from "./net.ts";
import os from "./os.ts";
import path from "./path.ts";
import perfHooks from "./perf_hooks.ts";
import process from "./process.ts";
import querystring from "./querystring.ts";
import stream from "./stream.ts";
import stringDecoder from "./string_decoder.ts";
import sys from "./sys.ts";
import timers from "./timers.ts";
import timersPromises from "./timers/promises.ts";
import tty from "./tty.ts";
import url from "./url.ts";
import util from "./util.ts";

// TODO(kt3k): add these modules when implemented
// import cluster from "./cluster.ts";
// import dgram from "./dgram.ts";
// import http2 from "./http2.ts";
// import https from "./https.ts";
// import readline from "./readline.ts";
// import repl from "./repl.ts";
// import sys from "./sys.ts";
// import tls from "./tls.ts";
// import vm from "./vm.ts";
// import workerThreads from "./worker_threads.ts";
// import zlib from "./zlib.ts";

// Canonical mapping of supported modules
export default {
  assert,
  "assert/strict": assertStrict,
  buffer,
  crypto,
  console,
  constants,
  "child_process": childProcess,
  dns,
  events,
  fs,
  "fs/promises": fsPromises,
  http,
  net,
  os,
  path,
  "perf_hooks": perfHooks,
  process,
  querystring,
  stream,
  "string_decoder": stringDecoder,
  sys,
  timers,
  "timers/promises": timersPromises,
  tty,
  url,
  util,
  zlib: {},
} as Record<string, unknown>;
