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
  validateNumber,
  validateOneOf,
  validateString,
  validateFunction,
  validateBoolean,
} from "./internal/validators.mjs";
import { isIP } from "./internal/net.ts";
import {
  emitInvalidHostnameWarning,
  getDefaultVerbatim,
  isFamily,
  isLookupCallback,
  isLookupOptions,
  validateHints,
} from "./internal/dns/utils.ts";
import promises from "./internal/dns/promises.ts";
import type {
  LookupAddress,
  LookupAllOptions,
  LookupOneOptions,
  LookupOptions,
} from "./internal/dns/utils.ts";
import type { ErrnoException } from "./internal/errors.ts";
import { dnsException, ERR_INVALID_ARG_TYPE } from "./internal/errors.ts";
import {
  AI_ADDRCONFIG as ADDRCONFIG,
  getaddrinfo,
  GetAddrInfoReqWrap,
} from "./internal_binding/cares_wrap.ts";
import { toASCII } from "./internal/idna.ts";

function onlookup(
  this: GetAddrInfoReqWrap,
  err: number | null,
  addresses: string[],
) {
  if (err) {
    return this.callback(dnsException(err, "getaddrinfo", this.hostname));
  }

  this.callback(null, addresses[0], this.family || isIP(addresses[0]));
}

function onlookupall(
  this: GetAddrInfoReqWrap,
  err: number | null,
  addresses: string[],
) {
  if (err) {
    return this.callback(dnsException(err, "getaddrinfo", this.hostname));
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

const validFamilies = [0, 4, 6];

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
  let family = 0;
  let all = false;
  let verbatim = getDefaultVerbatim();

  // Parse arguments
  if (hostname) {
    validateString(hostname, "hostname");
  }

  if (isLookupCallback(options)) {
    callback = options;
    family = 0;
  } else if (isFamily(options)) {
    validateFunction(callback, "callback");

    validateOneOf(options, "family", validFamilies);
    family = options;
  } else if (!isLookupOptions(options)) {
    validateFunction(arguments.length === 2 ? options : callback, "callback");

    throw new ERR_INVALID_ARG_TYPE("options", ["integer", "object"], options);
  } else {
    validateFunction(callback, "callback");

    if (options?.hints != null) {
      validateNumber(options.hints, "options.hints");
      hints = options.hints >>> 0;
      validateHints(hints);
    }

    if (options?.family != null) {
      validateOneOf(options.family, "options.family", validFamilies);
      family = options.family;
    }

    if (options?.all != null) {
      validateBoolean(options.all, "options.all");
      all = options.all;
    }
    
    if (options?.verbatim != null) {
      validateBoolean(options.verbatim, "options.verbatim");
      verbatim = options.verbatim;
    }
  }

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
      nextTick(callback as LookupCallback, null, [
        { address: hostname, family: matchedFamily },
      ]);
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

  const err = getaddrinfo(req, toASCII(hostname), family, hints, verbatim);

  if (err) {
    nextTick(callback as LookupCallback, dnsException(err, "getaddrinfo", hostname));

    return {};
  }

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

export { ADDRCONFIG, lookup, promises };

export default {
  ADDRCONFIG,
  lookup,
  promises,
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
