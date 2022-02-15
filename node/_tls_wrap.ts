// Copyright 2022 Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any
import { readAll } from "../streams/conversion.ts";
import {
  ArrayPrototypeIncludes,
  ArrayPrototypeSome,
  ObjectAssign,
  RegExpPrototypeTest,
  StringFromCharCode,
  StringPrototypeCharCodeAt,
  StringPrototypeEndsWith,
  StringPrototypeIncludes,
  StringPrototypeReplace,
  StringPrototypeSplit,
  StringPrototypeStartsWith,
} from "./internal/primordials.js";
import assert from "./internal/assert.js";
import net from "./net.ts";
import { createSecureContext } from "./_tls_common.ts";
import { kStreamBaseField } from "./internal_binding/stream_wrap.ts";
import { onStreamRead } from "./internal/stream_base_commons.ts";
import { notImplemented } from "./_utils.ts";
import {
  connResetException,
  ERR_TLS_DH_PARAM_SIZE,
} from "./internal/errors.ts";
import { emitWarning } from "./process.ts";
import { debuglog } from "./internal/util/debuglog.ts";
const kConnectOptions = Symbol("connect-options");
const kIsVerified = Symbol("verified");
const kPendingSession = Symbol("pendingSession");
const kRes = Symbol("res");

let debug = debuglog("tls", (fn) => {
  debug = fn;
});

function onConnectSecure(this: any) {
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

    const _cert = tlsOptions?.secureContext?.cert;
    const _key = tlsOptions?.secureContext?.key;

    let caCerts = tlsOptions?.secureContext?.ca;
    if (typeof caCerts === "string") caCerts = [caCerts];

    if (!socket) {
      socket = net.connect(tlsOptions);
    }
    super({ ...opts, socket });
    this._parent = socket;
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

    this._handle = socket._handle;
    (this._handle as any).verifyError = function () {
      return null; // Never fails, rejectUnauthorized is always true in Deno.
    };

    this.connecting = true;
    if (socket.connecting) {
      socket.once("connect", () => go(this, socket));
    } else {
      go(this, socket);
    }

    async function go(that: TLSSocket, socket: any) {
      const handle = socket._handle;
      const options = { caCerts, hostname };

      let conn: any;
      try {
        conn = await Deno.startTls(handle[kStreamBaseField], options);
      } catch (err) {
        that.emit("_tlsError", err);
        return;
      }

      console.log("sets handle[kStreamBaseField]")
      handle[kStreamBaseField] = {
        ...conn,
        write(...args: any[]) {
          console.log("write", args)
          const p = conn.write(...args);
          return p;
        },
        read(...args: any[]) {
          console.log("read", conn);
          const p = conn.read(...args);
          return p
        },
        close() {
          console.log("close", conn);
          console.log("stack is", new Error().stack);
          //conn.close();
        }
      };
      console.log("handle.onread", handle.onread);
      handle.onread = onStreamRead;
      console.log("handle.onread", handle.onread);
      that.connecting = false;
      that.emit("connect", socket);
      that.emit("secure");
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

  /*
  if (!options.socket) {
    // If user provided the socket, it's their responsibility to manage its
    // connectivity. If we created one internally, we connect it.
    if (options.timeout) {
      tlssock.setTimeout(options.timeout);
    }

    tlssock.connect(options, tlssock._start);
  }
  */

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

export function checkServerIdentity(_hostname: string, _cert: any) {
  // TODO(kt3k): Implement this when Deno provides APIs for getting peer
  // certificates.
  /*
  const subject = cert.subject;
  const altNames = cert.subjectaltname;
  const dnsNames: any[] = [];
  const uriNames: string[] = [];
  const ips: any[] = [];

  hostname = "" + hostname;

  if (altNames) {
    const splitAltNames = StringPrototypeSplit(altNames, ", ");
    ArrayPrototypeForEach(splitAltNames, (name: any) => {
      if (StringPrototypeStartsWith(name, "DNS:")) {
        ArrayPrototypePush(dnsNames, StringPrototypeSlice(name, 4));
      } else if (StringPrototypeStartsWith(name, "URI:")) {
        const uri = new URL(StringPrototypeSlice(name, 4));

        // TODO(bnoordhuis) Also use scheme.
        ArrayPrototypePush(uriNames, uri.hostname);
      } else if (StringPrototypeStartsWith(name, "IP Address:")) {
        ArrayPrototypePush(ips, canonicalizeIP(StringPrototypeSlice(name, 11)));
      }
    });
  }

  let valid = false;
  let reason = "Unknown reason";

  const hasAltNames = dnsNames.length > 0 || ips.length > 0 ||
    uriNames.length > 0;

  hostname = unfqdn(hostname); // Remove trailing dot for error messages.

  if (net.isIP(hostname)) {
    valid = ArrayPrototypeIncludes(ips, canonicalizeIP(hostname));
    if (!valid) {
      reason = `IP: ${hostname} is not in the cert's list: ` +
        ArrayPrototypeJoin(ips, ", ");
    }
    // TODO(bnoordhuis) Also check URI SANs that are IP addresses.
  } else if (hasAltNames || subject) {
    const hostParts = splitHost(hostname);
    const wildcard = (pattern: string) => check(hostParts, pattern, true);

    if (hasAltNames) {
      const noWildcard = (pattern: string) => check(hostParts, pattern, false);
      valid = ArrayPrototypeSome(dnsNames, wildcard) ||
        ArrayPrototypeSome(uriNames, noWildcard);
      if (!valid) {
        reason =
          `Host: ${hostname}. is not in the cert's altnames: ${altNames}`;
      }
    } else {
      // Match against Common Name only if no supported identifiers exist.
      const cn = subject.CN;

      if (ArrayIsArray(cn)) {
        valid = ArrayPrototypeSome(cn, wildcard);
      } else if (cn) {
        valid = wildcard(cn);
      }

      if (!valid) {
        reason = `Host: ${hostname}. is not cert's CN: ${cn}`;
      }
    }
  } else {
    reason = "Cert is empty";
  }
  if (!valid) {
    return new ERR_TLS_CERT_ALTNAME_INVALID(reason, hostname, cert);
  }
  */
}

function _canonicalizeIP(ip: string): string {
  return ip; // TODO(bnoordhuis) emulate uv_inet_pton() + uv_inet_ntop()
}

function unfqdn(host: string): string {
  return StringPrototypeReplace(host, /[.]$/, "");
}

function _check(hostParts: any, pattern: any, wildcards: any) {
  // Empty strings, null, undefined, etc. never match.
  if (!pattern) {
    return false;
  }

  const patternParts = splitHost(pattern);

  if (hostParts.length !== patternParts.length) {
    return false;
  }

  // Pattern has empty components, e.g. "bad..example.com".
  if (ArrayPrototypeIncludes(patternParts, "")) {
    return false;
  }

  // RFC 6125 allows IDNA U-labels (Unicode) in names but we have no
  // good way to detect their encoding or normalize them so we simply
  // reject them.  Control characters and blanks are rejected as well
  // because nothing good can come from accepting them.
  const isBad = (s: string) => RegExpPrototypeTest(/[^\u0021-\u007F]/u, s);
  if (ArrayPrototypeSome(patternParts, isBad)) {
    return false;
  }

  // Check host parts from right to left first.
  for (let i = hostParts.length - 1; i > 0; i -= 1) {
    if (hostParts[i] !== patternParts[i]) {
      return false;
    }
  }

  const hostSubdomain = hostParts[0];
  const patternSubdomain = patternParts[0];
  const patternSubdomainParts = StringPrototypeSplit(patternSubdomain, "*");

  // Short-circuit when the subdomain does not contain a wildcard.
  // RFC 6125 does not allow wildcard substitution for components
  // containing IDNA A-labels (Punycode) so match those verbatim.
  if (
    patternSubdomainParts.length === 1 ||
    StringPrototypeIncludes(patternSubdomain, "xn--")
  ) {
    return hostSubdomain === patternSubdomain;
  }

  if (!wildcards) {
    return false;
  }

  // More than one wildcard is always wrong.
  if (patternSubdomainParts.length > 2) {
    return false;
  }

  // *.tld wildcards are not allowed.
  if (patternParts.length <= 2) {
    return false;
  }

  const { 0: prefix, 1: suffix } = patternSubdomainParts;

  if (prefix.length + suffix.length > hostSubdomain.length) {
    return false;
  }

  if (!StringPrototypeStartsWith(hostSubdomain, prefix)) {
    return false;
  }

  if (!StringPrototypeEndsWith(hostSubdomain, suffix)) {
    return false;
  }

  return true;
}

// String#toLowerCase() is locale-sensitive so we use
// a conservative version that only lowercases A-Z.
function toLowerCase(c: string): string {
  return StringFromCharCode(32 + StringPrototypeCharCodeAt(c, 0));
}

function splitHost(host: string): string {
  return StringPrototypeSplit(
    StringPrototypeReplace(unfqdn(host), /[A-Z]/g, toLowerCase),
    ".",
  );
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
