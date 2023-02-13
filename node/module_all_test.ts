// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import moduleAll from "./module_all.ts";
import * as _http_agent from "./_http_agent.mjs";
import * as _http_outgoing from "./_http_outgoing.ts";
import * as _stream_duplex from "./internal/streams/duplex.mjs";
import * as _stream_passthrough from "./internal/streams/passthrough.mjs";
import * as _stream_readable from "./internal/streams/readable.mjs";
import * as _stream_transform from "./internal/streams/transform.mjs";
import * as _stream_writable from "./internal/streams/writable.mjs";
import * as assert from "./assert.ts";
import * as assertStrict from "./assert/strict.ts";
import * as async_hooks from "./async_hooks.ts";
import * as buffer from "./buffer.ts";
import * as childProcess from "./child_process.ts";
import * as cluster from "./cluster.ts";
import * as console from "./console.ts";
import * as _constants from "./constants.ts";
import * as crypto from "./crypto.ts";
import * as dgram from "./dgram.ts";
import * as diagnosticsChannel from "./diagnostics_channel.ts";
import * as dns from "./dns.ts";
import * as dnsPromises from "./dns/promises.ts";
import * as domain from "./domain.ts";
// TODO(kt3k): enable this
// import * as events from "./events.ts";
import * as fs from "./fs.ts";
import * as fsPromises from "./fs/promises.ts";
import * as http from "./http.ts";
import * as http2 from "./http2.ts";
import * as https from "./https.ts";
import * as inspector from "./inspector.ts";
import * as internalCp from "./internal/child_process.ts";
import * as internalCryptoCertificate from "./internal/crypto/certificate.ts";
import * as internalCryptoCipher from "./internal/crypto/cipher.ts";
import * as internalCryptoDiffiehellman from "./internal/crypto/diffiehellman.ts";
import * as internalCryptoHash from "./internal/crypto/hash.ts";
import * as internalCryptoHkdf from "./internal/crypto/hkdf.ts";
import * as internalCryptoKeygen from "./internal/crypto/keygen.ts";
import * as internalCryptoKeys from "./internal/crypto/keys.ts";
import * as internalCryptoPbkdf2 from "./internal/crypto/pbkdf2.ts";
import * as internalCryptoRandom from "./internal/crypto/random.ts";
import * as internalCryptoScrypt from "./internal/crypto/scrypt.ts";
import * as internalCryptoSig from "./internal/crypto/sig.ts";
import * as internalCryptoUtil from "./internal/crypto/util.ts";
import * as internalCryptoX509 from "./internal/crypto/x509.ts";
import * as internalDgram from "./internal/dgram.ts";
import * as internalDnsPromises from "./internal/dns/promises.ts";
import * as internalErrors from "./internal/errors.ts";
import * as internalEventTarget from "./internal/event_target.mjs";
import * as internalFsUtils from "./internal/fs/utils.mjs";
import * as internalHttp from "./internal/http.ts";
import * as internalReadlineUtils from "./internal/readline/utils.mjs";
import * as internalStreamsAddAbortSignal from "./internal/streams/add-abort-signal.mjs";
import * as internalStreamsBufferList from "./internal/streams/buffer_list.mjs";
import * as internalStreamsLazyTransform from "./internal/streams/lazy_transform.mjs";
import * as internalStreamsState from "./internal/streams/state.mjs";
import * as internalTestBinding from "./internal/test/binding.ts";
import * as internalTimers from "./internal/timers.mjs";
import * as internalUtil from "./internal/util.mjs";
import * as internalUtilInspect from "./internal/util/inspect.mjs";
import * as net from "./net.ts";
import * as os from "./os.ts";
import * as pathPosix from "./path/posix.ts";
import * as pathWin32 from "./path/win32.ts";
import * as path from "./path.ts";
import * as perfHooks from "./perf_hooks.ts";
import * as punycode from "./punycode.ts";
import * as querystring from "./querystring.ts";
import * as readline from "./readline.ts";
import * as readlinePromises from "./readline/promises.ts";
import * as repl from "./repl.ts";
// TODO(kt3k): enable this
// import * as stream from "./stream.ts";
import * as streamConsumers from "./stream/consumers.mjs";
import * as streamPromises from "./stream/promises.mjs";
import * as streamWeb from "./stream/web.ts";
import * as stringDecoder from "./string_decoder.ts";
import * as sys from "./sys.ts";
import * as timers from "./timers.ts";
import * as timersPromises from "./timers/promises.ts";
import * as tls from "./tls.ts";
import * as tty from "./tty.ts";
import * as url from "./url.ts";
import * as util from "./util.ts";
import * as utilTypes from "./util/types.ts";
import * as v8 from "./v8.ts";
import * as vm from "./vm.ts";
import * as workerThreads from "./worker_threads.ts";
import * as wasi from "./wasi.ts";
import * as zlib from "./zlib.ts";

Deno.test("modules", () => {
  assertEquals(keys(moduleAll._http_agent), keys(_http_agent));
  assertEquals(keys(moduleAll._http_outgoing), keys(_http_outgoing));
  assertEquals(keys(moduleAll._stream_duplex), keys(_stream_duplex));
  assertEquals(keys(moduleAll._stream_passthrough), keys(_stream_passthrough));
  assertEquals(keys(moduleAll._stream_readable), keys(_stream_readable));
  assertEquals(keys(moduleAll._stream_transform), keys(_stream_transform));
  assertEquals(keys(moduleAll._stream_writable), keys(_stream_writable));
  assertEquals(keys(moduleAll.assert), keys(assert));
  assertEquals(keys(moduleAll["assert/strict"]), keys(assertStrict));
  assertEquals(keys(moduleAll.async_hooks), keys(async_hooks));
  assertEquals(keys(moduleAll.buffer), keys(buffer));
  assertEquals(keys(moduleAll.child_process), keys(childProcess));
  assertEquals(keys(moduleAll.cluster), keys(cluster));
  assertEquals(keys(moduleAll.console), keys(console));
  // Note: We don't check for constants module as they vary on platform,
  // and it's difficult to pass this check with all platforms.
  // assertEquals(keys(moduleAll.constants), keys(constants));
  assertEquals(keys(moduleAll.crypto), keys(crypto));
  assertEquals(keys(moduleAll.dgram), keys(dgram));
  assertEquals(keys(moduleAll.diagnostics_channel), keys(diagnosticsChannel));
  assertEquals(keys(moduleAll.dns), keys(dns));
  assertEquals(keys(moduleAll["dns/promises"]), keys(dnsPromises));
  assertEquals(keys(moduleAll.domain), keys(domain));
  // TODO(kt3k): enable this check
  // assertEquals(keys(moduleAll.events), keys(events));
  assertEquals(keys(moduleAll.fs), keys(fs));
  assertEquals(keys(moduleAll["fs/promises"]), keys(fsPromises));
  assertEquals(keys(moduleAll.http), keys(http));
  assertEquals(keys(moduleAll.http2), keys(http2));
  assertEquals(keys(moduleAll.https), keys(https));
  assertEquals(keys(moduleAll.inspector), keys(inspector));
  assertEquals(
    keys(moduleAll["internal/child_process"]),
    keys(internalCp),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/certificate"]),
    keys(internalCryptoCertificate),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/cipher"]),
    keys(internalCryptoCipher),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/diffiehellman"]),
    keys(internalCryptoDiffiehellman),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/hash"]),
    keys(internalCryptoHash),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/hkdf"]),
    keys(internalCryptoHkdf),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/keygen"]),
    keys(internalCryptoKeygen),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/keys"]),
    keys(internalCryptoKeys),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/pbkdf2"]),
    keys(internalCryptoPbkdf2),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/random"]),
    keys(internalCryptoRandom),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/scrypt"]),
    keys(internalCryptoScrypt),
  );
  assertEquals(keys(moduleAll["internal/crypto/sig"]), keys(internalCryptoSig));
  assertEquals(
    keys(moduleAll["internal/crypto/util"]),
    keys(internalCryptoUtil),
  );
  assertEquals(
    keys(moduleAll["internal/crypto/x509"]),
    keys(internalCryptoX509),
  );
  assertEquals(keys(moduleAll["internal/dgram"]), keys(internalDgram));
  assertEquals(
    keys(moduleAll["internal/dns/promises"]),
    keys(internalDnsPromises),
  );
  assertEquals(keys(moduleAll["internal/errors"]), keys(internalErrors));
  assertEquals(
    keys(moduleAll["internal/event_target"]),
    keys(internalEventTarget),
  );
  assertEquals(keys(moduleAll["internal/fs/utils"]), keys(internalFsUtils));
  assertEquals(keys(moduleAll["internal/http"]), keys(internalHttp));
  assertEquals(
    keys(moduleAll["internal/readline/utils"]),
    keys(internalReadlineUtils),
  );
  assertEquals(
    keys(moduleAll["internal/streams/add-abort-signal"]),
    keys(internalStreamsAddAbortSignal),
  );
  assertEquals(
    keys(moduleAll["internal/streams/buffer_list"]),
    keys(internalStreamsBufferList),
  );
  assertEquals(
    keys(moduleAll["internal/streams/lazy_transform"]),
    keys(internalStreamsLazyTransform),
  );
  assertEquals(
    keys(moduleAll["internal/streams/state"]),
    keys(internalStreamsState),
  );
  assertEquals(
    keys(moduleAll["internal/test/binding"]),
    keys(internalTestBinding),
  );
  assertEquals(keys(moduleAll["internal/timers"]), keys(internalTimers));
  assertEquals(keys(moduleAll["internal/util"]), keys(internalUtil));
  assertEquals(
    keys(moduleAll["internal/util/inspect"]),
    keys(internalUtilInspect),
  );
  assertEquals(keys(moduleAll.net), keys(net));
  assertEquals(keys(moduleAll.os), keys(os));
  assertEquals(keys(moduleAll["path/posix"]), keys(pathPosix));
  assertEquals(keys(moduleAll["path/win32"]), keys(pathWin32));
  assertEquals(keys(moduleAll.path), keys(path));
  assertEquals(keys(moduleAll.perf_hooks), keys(perfHooks));
  // skip process
  assertEquals(keys(moduleAll.punycode), keys(punycode));
  assertEquals(keys(moduleAll.querystring), keys(querystring));
  assertEquals(keys(moduleAll.readline), keys(readline));
  assertEquals(keys(moduleAll["readline/promises"]), keys(readlinePromises));
  assertEquals(keys(moduleAll.repl), keys(repl));
  // TODO(kt3k): enable this check
  // assertEquals(keys(moduleAll.stream), keys(stream));
  assertEquals(keys(moduleAll["stream/consumers"]), keys(streamConsumers));
  assertEquals(keys(moduleAll["stream/promises"]), keys(streamPromises));
  assertEquals(keys(moduleAll["stream/web"]), keys(streamWeb));
  assertEquals(keys(moduleAll.string_decoder), keys(stringDecoder));
  assertEquals(keys(moduleAll.sys), keys(sys));
  assertEquals(keys(moduleAll.timers), keys(timers));
  assertEquals(keys(moduleAll["timers/promises"]), keys(timersPromises));
  assertEquals(keys(moduleAll.tls), keys(tls));
  assertEquals(keys(moduleAll.tty), keys(tty));
  assertEquals(keys(moduleAll.url), keys(url));
  assertEquals(keys(moduleAll.util), keys(util));
  assertEquals(keys(moduleAll["util/types"]), keys(utilTypes));
  assertEquals(keys(moduleAll.v8), keys(v8));
  assertEquals(keys(moduleAll.vm), keys(vm));
  assertEquals(keys(moduleAll.wasi), keys(wasi));
  assertEquals(keys(moduleAll.worker_threads), keys(workerThreads));
  assertEquals(keys(moduleAll.zlib), keys(zlib));
});

Deno.test("modules can be imported without any permission", async () => {
  const { code, stderr } = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "module_all.ts",
    ],
    cwd: path.dirname(path.fromFileUrl(import.meta.url)),
  }).output();
  if (stderr.length > 0) {
    console.log(new TextDecoder().decode(stderr));
  }
  assertEquals(code, 0);
});

// deno-lint-ignore no-explicit-any
function keys(obj: any): Set<string> {
  const keys = new Set(Object.keys(obj));
  // omits 'default'
  keys.delete("default");
  return keys;
}
