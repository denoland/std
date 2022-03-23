// Copyright 2018-2022 Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any
import {
  ObjectAssign,
  StringPrototypeReplace,
} from "./internal/primordials.mjs";
import assert from "./internal/assert.mjs";
import * as net from "./net.ts";
import { createSecureContext } from "./_tls_common.ts";
import { kStreamBaseField } from "./internal_binding/stream_wrap.ts";
import { connResetException } from "./internal/errors.ts";
import { emitWarning } from "./process.ts";
import { debuglog } from "./internal/util/debuglog.ts";
import { constants as TCPConstants, TCP } from "./internal_binding/tcp_wrap.ts";
import {
  constants as PipeConstants,
  Pipe,
} from "./internal_binding/pipe_wrap.ts";
import { EventEmitter } from "./events.ts";
import { join } from "./path.ts";
const kConnectOptions = Symbol("connect-options");
const kIsVerified = Symbol("verified");
const kPendingSession = Symbol("pendingSession");
const kRes = Symbol("res");

let _debug = debuglog("tls", (fn) => {
  _debug = fn;
});

function onConnectEnd(this: any) {
  // NOTE: This logic is shared with _http_client.js
  if (!this._hadError) {
    const options = this[kConnectOptions];
    this._hadError = true;
    const error: any = connResetException(
      "Client network socket disconnected " +
        "before secure TLS connection was " +
        "established",
    );
    error.path = options.path;
    error.host = options.host;
    error.port = options.port;
    error.localAddress = options.localAddress;
    this.destroy(error);
  }
}

export class TLSSocket extends net.Socket {
  _tlsOptions: any;
  _secureEstablished: boolean;
  _securePending: boolean;
  _newSessionPending: boolean;
  _controlReleased: boolean;
  secureConnecting: boolean;
  _SNICallback: any;
  servername: string | null;
  alpnProtocol: any;
  authorized: boolean;
  authorizationError: any;
  [kRes]: any;
  [kIsVerified]: boolean;
  [kPendingSession]: any;
  [kConnectOptions]: any;
  ssl: any;
  _start: any;
  constructor(socket: any, opts: any) {
    const tlsOptions = { ...opts };

    let hostname = tlsOptions?.secureContext?.servername;
    hostname = opts.host;
    tlsOptions.hostname = hostname;

    const _cert = tlsOptions?.secureContext?.cert;
    const _key = tlsOptions?.secureContext?.key;

    let caCerts = tlsOptions?.secureContext?.ca;
    if (typeof caCerts === "string") caCerts = [caCerts];
    tlsOptions.caCerts = caCerts;

    super({
      handle: _wrapHandle(tlsOptions, socket),
      ...opts,
      manualStart: true, // This prevents premature reading from TLS handle
    });
    if (socket) {
      this._parent = socket;
    }
    this._tlsOptions = tlsOptions;
    this._secureEstablished = false;
    this._securePending = false;
    this._newSessionPending = false;
    this._controlReleased = false;
    this.secureConnecting = true;
    this._SNICallback = null;
    this.servername = null;
    this.alpnProtocol = null;
    this.authorized = false;
    this.authorizationError = null;
    this[kRes] = null;
    this[kIsVerified] = false;
    this[kPendingSession] = null;

    this.ssl = new class {
      verifyError() {
        return null; // Never fails, rejectUnauthorized is always true in Deno.
      }
    }();

    // deno-lint-ignore no-this-alias
    const tlssock = this;

    /** Wraps the given socket and adds the tls capability to the underlying
     * handle */
    function _wrapHandle(tlsOptions: any, wrap: net.Socket | undefined) {
      let handle: any;

      if (wrap) {
        handle = wrap._handle;
      }

      const options = tlsOptions;
      if (!handle) {
        handle = options.pipe
          ? new Pipe(PipeConstants.SOCKET)
          : new TCP(TCPConstants.SOCKET);
      }

      // Patches `afterConnect` hook to replace TCP conn with TLS conn
      const afterConnect = handle.afterConnect;
      handle.afterConnect = async (req: any, status: number) => {
        try {
          const conn = await Deno.startTls(handle[kStreamBaseField], options);
          tlssock.emit("secure");
          tlssock.removeListener("end", onConnectEnd);
          handle[kStreamBaseField] = conn;
        } catch {
          // TODO(kt3k): Handle this
        }
        return afterConnect.call(handle, req, status);
      };

      (handle as any).verifyError = function () {
        return null; // Never fails, rejectUnauthorized is always true in Deno.
      };

      return handle;
    }
  }

  _tlsError(err: Error) {
    this.emit("_tlsError", err);
    if (this._controlReleased) {
      return err;
    }
    return null;
  }

  _releaseControl() {
    if (this._controlReleased) {
      return false;
    }
    this._controlReleased = true;
    this.removeListener("error", this._tlsError);
    return true;
  }

  getEphemeralKeyInfo() {
    return {};
  }

  isSessionReused() {
    return false;
  }

  setSession(_session: any) {
    // TODO(kt3k): implement this
  }

  setServername(_servername: any) {
    // TODO(kt3k): implement this
  }

  getPeerCertificate(_detailed: boolean) {
    // TODO(kt3k): implement this
    return {
      subject: "localhost",
      subjectaltname: "IP Address:127.0.0.1, IP Address:::1",
    };
  }
}

function normalizeConnectArgs(listArgs: any) {
  const args = net._normalizeArgs(listArgs);
  const options = args[0];
  const cb = args[1];

  // If args[0] was options, then normalize dealt with it.
  // If args[0] is port, or args[0], args[1] is host, port, we need to
  // find the options and merge them in, normalize's options has only
  // the host/port/path args that it knows about, not the tls options.
  // This means that options.host overrides a host arg.
  if (listArgs[1] !== null && typeof listArgs[1] === "object") {
    ObjectAssign(options, listArgs[1]);
  } else if (listArgs[2] !== null && typeof listArgs[2] === "object") {
    ObjectAssign(options, listArgs[2]);
  }

  return cb ? [options, cb] : [options];
}

let ipServernameWarned = false;

export function Server(options: any, listener: any) {
  return new ServerImpl(options, listener);
}

export class ServerImpl extends EventEmitter {
  listener?: Deno.TlsListener;
  #closed = false;
  constructor(public options: any, listener: any) {
    super();
    if (listener) {
      this.on("secureConnection", listener);
    }
  }

  listen(port: any, callback: any): this {
    const { key, cert } = this.options;

    // TODO(kt3k): We can avoid creating temp cert files
    // when we land the below PR:
    // https://github.com/denoland/deno/pull/13740
    const tmpdir = Deno.makeTempDirSync();
    const certFile = join(tmpdir, "cert");
    const keyFile = join(tmpdir, "key");
    Deno.writeTextFileSync(certFile, cert);
    Deno.writeTextFileSync(keyFile, key);

    // TODO(kt3k): Get this from optional 2nd argument.
    const hostname = "localhost";

    this.listener = Deno.listenTls({ port, hostname, certFile, keyFile });
    Deno.remove(tmpdir, { recursive: true });

    callback?.();
    this.#listen(this.listener);
    return this;
  }

  async #listen(listener: Deno.TlsListener) {
    while (!this.#closed) {
      try {
        // Creates TCP handle and socket directly from Deno.TlsConn.
        // This works as TLS socket. We don't use TLSSocket class for doing
        // this because Deno.startTls only supports client side tcp connection.
        const handle = new TCP(TCPConstants.SOCKET, await listener.accept());
        const socket = new net.Socket({ handle });
        this.emit("secureConnection", socket);
      } catch (e) {
        if (e instanceof Deno.errors.BadResource) {
          this.#closed = true;
        }
        // swallow
      }
    }
  }

  close(cb?: (err?: Error) => void): this {
    if (this.listener) {
      this.listener.close();
    }
    cb?.();
    return this;
  }
}

Server.prototype = ServerImpl.prototype;

export function createServer(options: any, listener: any) {
  return new ServerImpl(options, listener);
}

export function connect(...args: any[]) {
  args = normalizeConnectArgs(args);
  let options = args[0];
  const cb = args[1];
  const allowUnauthorized = getAllowUnauthorized();

  options = {
    rejectUnauthorized: !allowUnauthorized,
    ciphers: DEFAULT_CIPHERS,
    checkServerIdentity,
    minDHSize: 1024,
    ...options,
  };

  if (!options.keepAlive) {
    options.singleUse = true;
  }

  assert(typeof options.checkServerIdentity === "function");
  assert(
    typeof options.minDHSize === "number",
    "options.minDHSize is not a number: " + options.minDHSize,
  );
  assert(
    options.minDHSize > 0,
    "options.minDHSize is not a positive number: " +
      options.minDHSize,
  );

  const context = options.secureContext || createSecureContext(options);

  const tlssock = new TLSSocket(options.socket, {
    allowHalfOpen: options.allowHalfOpen,
    pipe: !!options.path,
    secureContext: context,
    isServer: false,
    requestCert: true,
    rejectUnauthorized: options.rejectUnauthorized !== false,
    session: options.session,
    ALPNProtocols: options.ALPNProtocols,
    requestOCSP: options.requestOCSP,
    enableTrace: options.enableTrace,
    pskCallback: options.pskCallback,
    highWaterMark: options.highWaterMark,
    onread: options.onread,
    signal: options.signal,
    ...options, // Caveat emptor: Node does not do this.
  });

  // rejectUnauthorized property can be explicitly defined as `undefined`
  // causing the assignment to default value (`true`) fail. Before assigning
  // it to the tlssock connection options, explicitly check if it is false
  // and update rejectUnauthorized property. The property gets used by TLSSocket
  // connection handler to allow or reject connection if unauthorized
  options.rejectUnauthorized = options.rejectUnauthorized !== false;

  tlssock[kConnectOptions] = options;

  if (cb) {
    tlssock.once("secureConnect", cb);
  }

  if (!options.socket) {
    // If user provided the socket, it's their responsibility to manage its
    // connectivity. If we created one internally, we connect it.
    if (options.timeout) {
      tlssock.setTimeout(options.timeout);
    }

    tlssock.connect(options, tlssock._start);
  }

  tlssock._releaseControl();

  if (options.session) {
    tlssock.setSession(options.session);
  }

  if (options.servername) {
    if (!ipServernameWarned && net.isIP(options.servername)) {
      emitWarning(
        "Setting the TLS ServerName to an IP address is not permitted by " +
          "RFC 6066. This will be ignored in a future version.",
        "DeprecationWarning",
        "DEP0123",
      );
      ipServernameWarned = true;
    }
    tlssock.setServername(options.servername);
  }

  if (options.socket) {
    tlssock._start();
  }

  tlssock.prependListener("end", onConnectEnd);

  return tlssock;
}

function getAllowUnauthorized() {
  return false;
}

// TODO(kt3k): Implement this when Deno provides APIs for getting peer
// certificates.
export function checkServerIdentity(_hostname: string, _cert: any) {
}

function unfqdn(host: string): string {
  return StringPrototypeReplace(host, /[.]$/, "");
}

// Order matters. Mirrors ALL_CIPHER_SUITES from rustls/src/suites.rs but
// using openssl cipher names instead. Mutable in Node but not (yet) in Deno.
export const DEFAULT_CIPHERS = [
  // TLSv1.3 suites
  "AES256-GCM-SHA384",
  "AES128-GCM-SHA256",
  "TLS_CHACHA20_POLY1305_SHA256",
  // TLSv1.2 suites
  "ECDHE-ECDSA-AES256-GCM-SHA384",
  "ECDHE-ECDSA-AES128-GCM-SHA256",
  "ECDHE-ECDSA-CHACHA20-POLY1305",
  "ECDHE-RSA-AES256-GCM-SHA384",
  "ECDHE-RSA-AES128-GCM-SHA256",
  "ECDHE-RSA-CHACHA20-POLY1305",
].join(":");

export default {
  TLSSocket,
  connect,
  createServer,
  checkServerIdentity,
  DEFAULT_CIPHERS,
  unfqdn,
};
