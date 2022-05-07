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
  validateBoolean,
  validateFunction,
  validateNumber,
  validateOneOf,
  validateString,
} from "./internal/validators.mjs";
import { isIP } from "./internal/net.ts";
import {
  emitInvalidHostnameWarning,
  getDefaultResolver,
  getDefaultVerbatim,
  isFamily,
  isLookupCallback,
  isLookupOptions,
  isResolverOptions,
  Resolver as ResolverBase,
  setDefaultResolver,
  setDefaultResultOrder,
  validateHints,
} from "./internal/dns/utils.ts";
import type {
  LookupAddress,
  LookupAllOptions,
  LookupOneOptions,
  LookupOptions,
  Resolve4Addresses,
  Resolve4Callback,
  Resolve6Addresses,
  Resolve6Callback,
  ResolveCaaAddress,
  ResolveCaaAddresses,
  ResolveCaaCallback,
  ResolveCallback,
  ResolveCnameAddresses,
  ResolveCnameCallback,
  ResolveHostnames,
  ResolveMxAddress,
  ResolveMxAddresses,
  ResolveMxCallback,
  ResolveNaptrAddress,
  ResolveNaptrAddresses,
  ResolveNaptrCallback,
  ResolveNsAddresses,
  ResolveNsCallback,
  ResolvePtrAddresses,
  ResolvePtrCallback,
  ResolveRecords,
  ResolveSoaAddress,
  ResolveSoaCallback,
  ResolveSrvCallback,
  ResolveSrvRecord,
  ResolveSrvRecords,
  ResolveTtlAddress,
  ResolveTxtCallback,
  ResolveTxtRecords,
  ReverseCallback,
} from "./internal/dns/utils.ts";
import promises from "./internal/dns/promises.ts";
import type { ErrnoException } from "./internal/errors.ts";
import {
  dnsException,
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
} from "./internal/errors.ts";
import {
  AI_ADDRCONFIG as ADDRCONFIG,
  AI_ALL as ALL,
  AI_V4MAPPED as V4MAPPED,
} from "./internal_binding/ares.ts";
import {
  ChannelWrapQuery,
  getaddrinfo,
  GetAddrInfoReqWrap,
  QueryReqWrap,
} from "./internal_binding/cares_wrap.ts";
import { toASCII } from "./internal/idna.ts";
import { notImplemented } from "./_utils.ts";

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
    nextTick(
      callback as LookupCallback,
      dnsException(err, "getaddrinfo", hostname),
    );

    return {};
  }

  return req;
}

Object.defineProperty(lookup, customPromisifyArgs, {
  value: ["address", "family"],
  enumerable: false,
});

function onresolve(
  this: QueryReqWrap,
  err: number,
  addresses: string[],
  ttls?: number[],
) {
  const parsedAddresses = ttls && this.ttl
    ? addresses.map((address: string, index: number) => ({
      address,
      ttl: ttls[index],
    }))
    : addresses;

  if (err) {
    this.callback(dnsException(err, this.bindingName, this.hostname));
  } else {
    this.callback(null, parsedAddresses);
  }
}

function resolver(bindingName: keyof ChannelWrapQuery) {
  function query(
    this: Resolver,
    name: string,
    /** options */ callback: unknown,
  ) {
    let options;

    if (isResolverOptions(callback)) {
      options = callback;
      callback = arguments[2];
    }

    validateString(name, "name");
    validateFunction(callback, "callback");

    const req = new QueryReqWrap();
    req.bindingName = bindingName;
    req.callback = callback as ResolveCallback;
    req.hostname = name;
    req.oncomplete = onresolve;

    if (options && options.ttl) {
      notImplemented("dns.resolve* ttl option");
    }
    // req.ttl = !!(options && options.ttl);

    const err = this._handle[bindingName](req, toASCII(name));

    if (err) {
      throw dnsException(err, bindingName, name);
    }

    return req;
  }

  Object.defineProperty(query, "name", { value: bindingName });

  return query;
}

const resolveMap = Object.create(null);

class Resolver extends ResolverBase {
  override resolveAny = (resolveMap.ANY = resolver("queryAny"));
  override resolve4 = (resolveMap.A = resolver("queryA"));
  override resolve6 = (resolveMap.AAAA = resolver("queryAaaa"));
  override resolveCaa = (resolveMap.CAA = resolver("queryCaa"));
  override resolveCname = (resolveMap.CNAME = resolver("queryCname"));
  override resolveMx = (resolveMap.MX = resolver("queryMx"));
  override resolveNs = (resolveMap.NS = resolver("queryNs"));
  override resolveTxt = (resolveMap.TXT = resolver("queryTxt"));
  override resolveSrv = (resolveMap.SRV = resolver("querySrv"));
  override resolvePtr = (resolveMap.PTR = resolver("queryPtr"));
  override resolveNaptr = (resolveMap.NAPTR = resolver("queryNaptr"));
  override resolveSoa = (resolveMap.SOA = resolver("querySoa"));
  override reverse = resolver("getHostByAddr");
  override resolve = _resolve;
}

function _resolve(
  this: Resolver,
  hostname: string,
  rrtype: string,
  callback: ResolveCallback,
) {
  let resolver;

  if (typeof rrtype === "string") {
    resolver = resolveMap[rrtype];
  } else if (typeof rrtype === "function") {
    resolver = resolveMap.A;
    callback = rrtype;
  } else {
    throw new ERR_INVALID_ARG_TYPE("rrtype", "string", rrtype);
  }

  if (typeof resolver === "function") {
    return Reflect.apply(resolver, this, [hostname, callback]);
  }

  throw new ERR_INVALID_ARG_VALUE("rrtype", rrtype);
}

function defaultResolverSetServers(servers: string[]) {
  const resolver = new Resolver();

  resolver.setServers(servers);
  setDefaultResolver(resolver);
}

// Longhand equivalents of `bindDefaultResolver` which binds the default
// resolver methods to the `module.exports` in Node implementation.

export function getServers() {
  return getDefaultResolver().getServers();
}

export function resolveAny(name: string, callback: ResolveCallback) {
  return getDefaultResolver().resolveAny(name, callback);
}

export function resolve4(name: string, callback: Resolve4Callback) {
  return getDefaultResolver().resolve4(name, callback);
}

export function resolve6(name: string, callback: Resolve6Callback) {
  return getDefaultResolver().resolve6(name, callback);
}

export function resolveCaa(name: string, callback: ResolveCaaCallback) {
  return getDefaultResolver().resolveCaa(name, callback);
}

export function resolveCname(name: string, callback: ResolveCnameCallback) {
  return getDefaultResolver().resolveCname(name, callback);
}

export function resolveMx(name: string, callback: ResolveMxCallback) {
  return getDefaultResolver().resolveMx(name, callback);
}

export function resolveNs(name: string, callback: ResolveNsCallback) {
  return getDefaultResolver().resolveNs(name, callback);
}

export function resolveTxt(name: string, callback: ResolveTxtCallback) {
  return getDefaultResolver().resolveTxt(name, callback);
}

export function resolveSrv(name: string, callback: ResolveSrvCallback) {
  return getDefaultResolver().resolveSrv(name, callback);
}

export function resolvePtr(name: string, callback: ResolvePtrCallback) {
  return getDefaultResolver().resolvePtr(name, callback);
}

export function resolveNaptr(name: string, callback: ResolveNaptrCallback) {
  return getDefaultResolver().resolveNaptr(name, callback);
}

export function resolveSoa(name: string, callback: ResolveSoaCallback) {
  return getDefaultResolver().resolveSoa(name, callback);
}

export function reverse(ip: string, callback: ReverseCallback) {
  return getDefaultResolver().reverse(ip, callback);
}

export function resolve(
  hostname: string,
  rrtype: string,
  callback: ResolveCallback,
) {
  return getDefaultResolver().resolve(hostname, rrtype, callback);
}

const defaultResolver = new Resolver();
setDefaultResolver(defaultResolver);

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

export {
  ADDRCONFIG,
  ALL,
  defaultResolverSetServers as setServers,
  lookup,
  promises,
  setDefaultResultOrder,
  V4MAPPED,
};

export type {
  LookupAddress,
  LookupAllOptions,
  LookupOneOptions,
  LookupOptions,
  Resolve4Addresses,
  Resolve4Callback,
  Resolve6Addresses,
  Resolve6Callback,
  ResolveCaaAddress,
  ResolveCaaAddresses,
  ResolveCaaCallback,
  ResolveCallback,
  ResolveCnameAddresses,
  ResolveCnameCallback,
  ResolveHostnames,
  ResolveMxAddress,
  ResolveMxAddresses,
  ResolveMxCallback,
  ResolveNaptrAddress,
  ResolveNaptrAddresses,
  ResolveNaptrCallback,
  ResolveNsAddresses,
  ResolveNsCallback,
  ResolvePtrAddresses,
  ResolvePtrCallback,
  ResolveRecords,
  ResolveSoaAddress,
  ResolveSoaCallback,
  ResolveSrvCallback,
  ResolveSrvRecord,
  ResolveSrvRecords,
  ResolveTtlAddress,
  ResolveTxtCallback,
  ResolveTxtRecords,
  ReverseCallback,
};

export default {
  ADDRCONFIG,
  ALL,
  V4MAPPED,
  lookup,
  getServers,
  resolveAny,
  resolve4,
  resolve6,
  resolveCaa,
  resolveCname,
  resolveMx,
  resolveNs,
  resolveTxt,
  resolveSrv,
  resolvePtr,
  resolveNaptr,
  resolveSoa,
  resolve,
  reverse,
  setServers: defaultResolverSetServers,
  setDefaultResultOrder,
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
