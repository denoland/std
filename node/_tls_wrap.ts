// Copyright 2022 Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import assert from "./internal/assert.js";
import net from "./net.ts";
import tls from "./tls.ts";
import { kStreamBaseField } from "./internal_binding/stream_wrap.ts";
import { notImplemented } from "./_utils.ts";

const kConnectOptions = Symbol("connect-options");
const kIsVerified = Symbol("verified");
const kPendingSession = Symbol("pendingSession");
const kRes = Symbol("res");

const debug = console.log; // TODO(bnoordhuis)

function onConnectSecure() {
  const options = this[kConnectOptions];

  // Check the size of DHE parameter above minimum requirement
  // specified in options.
  const ekeyinfo = this.getEphemeralKeyInfo();
  if (ekeyinfo.type === "DH" && ekeyinfo.size < options.minDHSize) {
    const err = new ERR_TLS_DH_PARAM_SIZE(ekeyinfo.size);
    debug("client emit:", err);
    this.emit("error", err);
    this.destroy();
    return;
  }

  let verifyError = this._handle.verifyError();

  // Verify that server's identity matches it's certificate's names
  // Unless server has resumed our existing session
  if (!verifyError && !this.isSessionReused()) {
    const hostname = options.servername ||
      options.host ||
      (options.socket && options.socket._host) ||
      "localhost";
    const cert = this.getPeerCertificate(true);
    verifyError = options.checkServerIdentity(hostname, cert);
  }

  if (verifyError) {
    this.authorized = false;
    this.authorizationError = verifyError.code || verifyError.message;

    // rejectUnauthorized property can be explicitly defined as `undefined`
    // causing the assignment to default value (`true`) fail. Before assigning
    // it to the tlssock connection options, explicitly check if it is false
    // and update rejectUnauthorized property. The property gets used by
    // TLSSocket connection handler to allow or reject connection if
    // unauthorized.
    // This check is potentially redundant, however it is better to keep it
    // in case the option object gets modified somewhere.
    if (options.rejectUnauthorized !== false) {
      this.destroy(verifyError);
      return;
    }
    debug(
      "client emit secureConnect. rejectUnauthorized: %s, " +
        "authorizationError: %s",
      options.rejectUnauthorized,
      this.authorizationError,
    );
    this.secureConnecting = false;
    this.emit("secureConnect");
  } else {
    this.authorized = true;
    debug("client emit secureConnect. authorized:", this.authorized);
    this.secureConnecting = false;
    this.emit("secureConnect");
  }

  this[kIsVerified] = true;
  const session = this[kPendingSession];
  this[kPendingSession] = null;
  if (session) {
    this.emit("session", session);
  }

  this.removeListener("end", onConnectEnd);
}

function onConnectEnd() {
  // NOTE: This logic is shared with _http_client.js
  if (!this._hadError) {
    const options = this[kConnectOptions];
    this._hadError = true;
    const error = connResetException(
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
  constructor(socket, opts) {
    super();

    const tlsOptions = { ...opts };
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
    this._handle = null;

    this.ssl = new class {
      verifyError() {
        return null; // Never fails, rejectUnauthorized is always true in Deno.
      }
    }();

    let hostname = tlsOptions?.secureContext?.servername;
    hostname = "localhost";

    const _cert = tlsOptions?.secureContext?.cert;
    const _key = tlsOptions?.secureContext?.key;

    let caCerts = tlsOptions?.secureContext?.ca;
    if (typeof caCerts === "string") caCerts = [caCerts];

    if (!socket) {
      socket = net.connect(tlsOptions);
    }

    this._handle = socket._handle;
    this._handle.verifyError = function () {
      return null; // Never fails, rejectUnauthorized is always true in Deno.
    };

    if (socket.connecting) {
      socket.once("connect", () => go(this, socket));
    } else {
      go(this, socket);
    }

    async function go(that, socket) {
      const handle = socket._handle;
      const options = { caCerts, hostname };

      let conn;
      try {
        conn = await Deno.startTls(handle[kStreamBaseField], options);
      } catch (err) {
        console.log("error", err);
        that.emit("_tlsError", err);
        return;
      }

      console.log("secure", conn);
      handle[kStreamBaseField] = {
        conn,
        write() {
          throw Error("write");
        },
      };
      that.emit("secure");
    }
  }

  _tlsError(err) {
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

  getPeerCertificate(_detailed) {
    return {
      subject: "localhost", // TODO
      subjectaltname: "IP Address:127.0.0.1, IP Address:::1",
    };
  }
}

function normalizeConnectArgs(listArgs) {
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

export function connect(...args) {
  args = normalizeConnectArgs(args);
  let options = args[0];
  const cb = args[1];
  const allowUnauthorized = getAllowUnauthorized();

  options = {
    rejectUnauthorized: !allowUnauthorized,
    ciphers: tls.DEFAULT_CIPHERS,
    checkServerIdentity: tls.checkServerIdentity,
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

  const context = options.secureContext || tls.createSecureContext(options);

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
      process.emitWarning(
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

  tlssock.on("secure", onConnectSecure);
  tlssock.prependListener("end", onConnectEnd);

  return tlssock;
}

function getAllowUnauthorized() {
  return false;
}

export function createServer() {
  notImplemented();
}

export default {
  TLSSocket,
  connect,
  createServer,
};
