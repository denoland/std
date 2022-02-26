// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

import { nextTick } from "./_next_tick.ts";
import { customPromisifyArgs } from "./internal/util.mjs";
import {
  validateCallback,
  validateOneOf,
  validateString,
} from "./internal/validators.mjs";
import { isIP } from "./internal/net.ts";
import {
  emitInvalidHostnameWarning,
  getDefaultVerbatim,
  validateHints,
} from "./_dns/_utils.ts";
import type { ErrnoException } from "./internal/errors.ts";
import { dnsException } from "./internal/errors.ts";
import {
  AI_ADDRCONFIG as ADDRCONFIG,
  getaddrinfo,
  GetAddrInfoReqWrap,
} from "./internal_binding/cares_wrap.ts";
import { toASCII } from "./internal/idna.ts";

export interface LookupOptions {
  family?: number | undefined;
  hints?: number | undefined;
  all?: boolean | undefined;
  verbatim?: boolean | undefined;
}

export interface LookupOneOptions extends LookupOptions {
  all?: false | undefined;
}

export interface LookupAllOptions extends LookupOptions {
  all: true;
}

export interface LookupAddress {
  address: string;
  family: number;
}

function _isLookupOptions(options: unknown): options is LookupOptions {
  return options !== null && typeof options === "object";
}

function _isLookupCallback(
  options: unknown,
): options is (...args: unknown[]) => void {
  return typeof options === "function";
}

function onlookup(
  this: GetAddrInfoReqWrap,
  code: number | null,
  addresses: string[],
) {
  if (code) {
    return this.callback(dnsException(code, "getaddrinfo", this.hostname));
  }

  this.callback(null, addresses[0], this.family || isIP(addresses[0]));
}

function onlookupall(
  this: GetAddrInfoReqWrap,
  code: number | null,
  addresses: string[],
) {
  if (code) {
    return this.callback(dnsException(code, "getaddrinfo", this.hostname));
  }

  const family = this.family;
  const parsedAddresses = [];

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    parsedAddresses[i] = {
      address: addr,
      family: family || isIP(addr),
    };
  }

  this.callback(null, parsedAddresses);
}

type LookupCallback = (
  err: ErrnoException | null,
  addressOrAddresses?: string | LookupAddress[] | null,
  family?: number,
) => void;

// Easy DNS A/AAAA look up
// lookup(hostname, [options,] callback)
function lookup(
  hostname: string,
  family: number,
  callback: (
    err: ErrnoException | null,
    address: string,
    family: number,
  ) => void,
): GetAddrInfoReqWrap | Record<string, never>;
function lookup(
  hostname: string,
  options: LookupOneOptions,
  callback: (
    err: ErrnoException | null,
    address: string,
    family: number,
  ) => void,
): GetAddrInfoReqWrap | Record<string, never>;
function lookup(
  hostname: string,
  options: LookupAllOptions,
  callback: (err: ErrnoException | null, addresses: LookupAddress[]) => void,
): GetAddrInfoReqWrap | Record<string, never>;
function lookup(
  hostname: string,
  options: LookupOptions,
  callback: (
    err: ErrnoException | null,
    address: string | LookupAddress[],
    family: number,
  ) => void,
): GetAddrInfoReqWrap | Record<string, never>;
function lookup(
  hostname: string,
  callback: (
    err: ErrnoException | null,
    address: string,
    family: number,
  ) => void,
): GetAddrInfoReqWrap | Record<string, never>;
function lookup(
  hostname: string,
  options: unknown,
  callback?: unknown,
): GetAddrInfoReqWrap | Record<string, never> {
  let hints = 0;
  let family = -1;
  let all = false;
  let verbatim = getDefaultVerbatim();

  // Parse arguments
  if (hostname) {
    validateString(hostname, "hostname");
  }

  if (_isLookupCallback(options)) {
    callback = options;
    family = 0;
  } else {
    validateCallback(callback);

    if (_isLookupOptions(options)) {
      hints = options.hints! >>> 0;
      family = options.family! >>> 0;
      all = options.all === true;

      if (typeof options.verbatim === "boolean") {
        verbatim = options.verbatim === true;
      }

      validateHints(hints);
    } else {
      family = (options as number) >>> 0;
    }
  }

  validateOneOf(family, "family", [0, 4, 6]);

  if (!hostname) {
    emitInvalidHostnameWarning(hostname);

    if (all) {
      nextTick(callback as LookupCallback, null, []);
    } else {
      nextTick(callback as LookupCallback, null, null, family === 6 ? 6 : 4);
    }

    return {};
  }

  const matchedFamily = isIP(hostname);

  if (matchedFamily) {
    if (all) {
      nextTick(
        callback as LookupCallback,
        null,
        [{ address: hostname, family: matchedFamily }],
      );
    } else {
      nextTick(callback as LookupCallback, null, hostname, matchedFamily);
    }

    return {};
  }

  const req = new GetAddrInfoReqWrap();
  req.callback = callback as LookupCallback;
  req.family = family;
  req.hostname = hostname;
  req.oncomplete = all ? onlookupall : onlookup;

  getaddrinfo(
    req,
    toASCII(hostname),
    family,
    hints,
    verbatim,
  );

  return req;
}

Object.defineProperty(lookup, customPromisifyArgs, {
  value: ["address", "family"],
  enumerable: false,
});

// ERROR CODES
export const NODATA = "ENODATA";
export const FORMERR = "EFORMERR";
export const SERVFAIL = "ESERVFAIL";
export const NOTFOUND = "ENOTFOUND";
export const NOTIMP = "ENOTIMP";
export const REFUSED = "EREFUSED";
export const BADQUERY = "EBADQUERY";
export const BADNAME = "EBADNAME";
export const BADFAMILY = "EBADFAMILY";
export const BADRESP = "EBADRESP";
export const CONNREFUSED = "ECONNREFUSED";
export const TIMEOUT = "ETIMEOUT";
export const EOF = "EOF";
export const FILE = "EFILE";
export const NOMEM = "ENOMEM";
export const DESTRUCTION = "EDESTRUCTION";
export const BADSTR = "EBADSTR";
export const BADFLAGS = "EBADFLAGS";
export const NONAME = "ENONAME";
export const BADHINTS = "EBADHINTS";
export const NOTINITIALIZED = "ENOTINITIALIZED";
export const LOADIPHLPAPI = "ELOADIPHLPAPI";
export const ADDRGETNETWORKPARAMS = "EADDRGETNETWORKPARAMS";
export const CANCELLED = "ECANCELLED";

export { ADDRCONFIG, lookup };

export default {
  ADDRCONFIG,
  lookup,
  NODATA,
  FORMERR,
  SERVFAIL,
  NOTFOUND,
  NOTIMP,
  REFUSED,
  BADQUERY,
  BADNAME,
  BADFAMILY,
  BADRESP,
  CONNREFUSED,
  TIMEOUT,
  EOF,
  FILE,
  NOMEM,
  DESTRUCTION,
  BADSTR,
  BADFLAGS,
  NONAME,
  BADHINTS,
  NOTINITIALIZED,
  LOADIPHLPAPI,
  ADDRGETNETWORKPARAMS,
  CANCELLED,
};
