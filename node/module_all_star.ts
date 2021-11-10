// Keep in sync with ./module_all.ts
import * as assert from "./assert.ts";
import * as assertStrict from "./assert/strict.ts";
import * as buffer from "./buffer.ts";
import * as crypto from "./crypto.ts";
import * as console from "./console.ts";
import * as constants from "./constants.ts";
import * as childProcess from "./child_process.ts";
import * as dns from "./dns.ts";
import * as events from "./events.ts";
import * as fs from "./fs.ts";
import * as fsPromises from "./fs/promises.ts";
import * as internalReadlineUtils from "./internal/readline/utils.js";
import * as http from "./http.ts";
import * as net from "./net.ts";
import * as os from "./os.ts";
import * as path from "./path.ts";
import * as perfHooks from "./perf_hooks.ts";
import * as process from "./process.ts";
import * as querystring from "./querystring.ts";
import * as readline from "./readline.ts";
import * as stream from "./stream.ts";
import * as streamWeb from "./stream/web.ts";
import * as stringDecoder from "./string_decoder.ts";
import * as sys from "./sys.ts";
import * as timers from "./timers.ts";
import * as timersPromises from "./timers/promises.ts";
import * as tty from "./tty.ts";
import * as vm from "./vm.ts";
import * as url from "./url.ts";
import * as util from "./util.ts";

// TODO(kt3k): add these modules when implemented
// import cluster from "./cluster.ts";
// import dgram from "./dgram.ts";
// import http2 from "./http2.ts";
// import https from "./https.ts";
// import repl from "./repl.ts";
// import tls from "./tls.ts";
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
  "internal/readline/utils": internalReadlineUtils,
  net,
  os,
  path,
  "perf_hooks": perfHooks,
  process,
  querystring,
  readline,
  stream,
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
} as Record<string, unknown>;
