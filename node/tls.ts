// Copyright 2022 Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import {
  ArrayIsArray,
  ArrayPrototypeForEach,
  ArrayPrototypeIncludes,
  ArrayPrototypeJoin,
  ArrayPrototypePush,
  //ArrayPrototypeReduce,
  ArrayPrototypeSome,
  //ObjectDefineProperty,
  //ObjectFreeze,
  RegExpPrototypeTest,
  StringFromCharCode,
  StringPrototypeCharCodeAt,
  StringPrototypeEndsWith,
  StringPrototypeIncludes,
  StringPrototypeReplace,
  StringPrototypeSlice,
  StringPrototypeSplit,
  StringPrototypeStartsWith,
} from "./internal/primordials.js";

import net from "./net.ts";
import _tls_common from "./_tls_common.ts";
import _tls_wrap from "./_tls_wrap.ts";

// openssl -> rustls
const cipherMap = {
  "__proto__": null,
  "AES128-GCM-SHA256": "TLS13_AES_128_GCM_SHA256",
  "AES256-GCM-SHA384": "TLS13_AES_256_GCM_SHA384",
  "ECDHE-ECDSA-AES128-GCM-SHA256": "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
  "ECDHE-ECDSA-AES256-GCM-SHA384": "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
  "ECDHE-ECDSA-CHACHA20-POLY1305":
    "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
  "ECDHE-RSA-AES128-GCM-SHA256": "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
  "ECDHE-RSA-AES256-GCM-SHA384": "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
  "ECDHE-RSA-CHACHA20-POLY1305": "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
  "TLS_AES_128_GCM_SHA256": "TLS13_AES_128_GCM_SHA256",
  "TLS_AES_256_GCM_SHA384": "TLS13_AES_256_GCM_SHA384",
  "TLS_CHACHA20_POLY1305_SHA256": "TLS13_CHACHA20_POLY1305_SHA256",
};

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

function unfqdn(host) {
  return StringPrototypeReplace(host, /[.]$/, "");
}

// String#toLowerCase() is locale-sensitive so we use
// a conservative version that only lowercases A-Z.
function toLowerCase(c) {
  return StringFromCharCode(32 + StringPrototypeCharCodeAt(c, 0));
}

function splitHost(host) {
  return StringPrototypeSplit(
    StringPrototypeReplace(unfqdn(host), /[A-Z]/g, toLowerCase),
    ".",
  );
}

function check(hostParts, pattern, wildcards) {
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
  const isBad = (s) => RegExpPrototypeTest(/[^\u0021-\u007F]/u, s);
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

export function checkServerIdentity(hostname, cert) {
  const subject = cert.subject;
  const altNames = cert.subjectaltname;
  const dnsNames = [];
  const uriNames = [];
  const ips = [];

  hostname = "" + hostname;

  if (altNames) {
    const splitAltNames = StringPrototypeSplit(altNames, ", ");
    ArrayPrototypeForEach(splitAltNames, (name) => {
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
    const wildcard = (pattern) => check(hostParts, pattern, true);

    if (hasAltNames) {
      const noWildcard = (pattern) => check(hostParts, pattern, false);
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
}

function canonicalizeIP(ip) {
  return ip; // TODO(bnoordhuis) emulate uv_inet_pton() + uv_inet_ntop()
}

export function getCiphers() {
  // TODO(bnoordhuis) Use locale-insensitive toLowerCase()
  return Object.keys(cipherMap).map((name) => name.toLowerCase());
}

export const rootCertificates = undefined;
export const DEFAULT_ECDH_CURVE = "auto";
export const DEFAULT_MAX_VERSION = "TLSv1.3";
export const DEFAULT_MIN_VERSION = "TLSv1.2";

class ERR_TLS_CERT_ALTNAME_INVALID extends Error {
  constructor(reason, host, cert) {
    super(`Hostname/IP does not match certificate's altnames: ${reason}`);
    this.reason = reason;
    this.host = host;
    this.cert = cert;
  }
}

export default {
  DEFAULT_CIPHERS,
  DEFAULT_ECDH_CURVE,
  DEFAULT_MAX_VERSION,
  DEFAULT_MIN_VERSION,
  checkServerIdentity,

  createSecureContext: _tls_common.createSecureContext,
  SecureContext: _tls_common.SecureContext,
  TLSSocket: _tls_wrap.TLSSocket,
  Server: _tls_wrap.Server,
  createServer: _tls_wrap.createServer,
  connect: _tls_wrap.connect,
};

export const createSecureContext = _tls_common.createSecureContext;
export const SecureContext = _tls_common.SecureContext;
export const TLSSocket = _tls_wrap.TLSSocket;
export const Server = _tls_wrap.Server;
export const createServer = _tls_wrap.createServer;
export const connect = _tls_wrap.connect;
