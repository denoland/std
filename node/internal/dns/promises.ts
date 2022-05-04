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

import {
  validateBoolean,
  validateNumber,
  validateOneOf,
  validateString,
} from "../validators.mjs";
import { isIP } from "../net.ts";
import {
  emitInvalidHostnameWarning,
  getDefaultVerbatim,
  isFamily,
  isLookupOptions,
  validateHints,
} from "../dns/utils.ts";
import type {
  LookupAddress,
  LookupAllOptions,
  LookupOneOptions,
  LookupOptions,
} from "../dns/utils.ts";
import { dnsException, ERR_INVALID_ARG_TYPE } from "../errors.ts";
import {
  getaddrinfo,
  GetAddrInfoReqWrap,
} from "../../internal_binding/cares_wrap.ts";
import { toASCII } from "../idna.ts";

function onlookup(
  this: GetAddrInfoReqWrap,
  err: number | null,
  addresses: string[],
) {
  if (err) {
    this.reject(dnsException(err, "getaddrinfo", this.hostname));
    return;
  }

  const family = this.family || isIP(addresses[0]);
  this.resolve({ address: addresses[0], family });
}

function onlookupall(
  this: GetAddrInfoReqWrap,
  err: number | null,
  addresses: string[],
) {
  if (err) {
    this.reject(dnsException(err, "getaddrinfo", this.hostname));

    return;
  }

  const family = this.family;
  const parsedAddresses = [];

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    parsedAddresses[i] = {
      address,
      family: family ? family : isIP(address),
    };
  }

  this.resolve(parsedAddresses);
}

function createLookupPromise(
  family: number,
  hostname: string,
  all: boolean,
  hints: number,
  verbatim: boolean,
): Promise<void | LookupAddress | LookupAddress[]> {
  return new Promise((resolve, reject) => {
    if (!hostname) {
      emitInvalidHostnameWarning(hostname);
      resolve(all ? [] : { address: null, family: family === 6 ? 6 : 4 });

      return;
    }

    const matchedFamily = isIP(hostname);

    if (matchedFamily !== 0) {
      const result = { address: hostname, family: matchedFamily };
      resolve(all ? [result] : result);

      return;
    }

    const req = new GetAddrInfoReqWrap();

    req.family = family;
    req.hostname = hostname;
    req.oncomplete = all ? onlookupall : onlookup;
    req.resolve = resolve;
    req.reject = reject;

    const err = getaddrinfo(req, toASCII(hostname), family, hints, verbatim);

    if (err) {
      reject(dnsException(err, "getaddrinfo", hostname));
    }
  });
}

const validFamilies = [0, 4, 6];

function lookup(
  hostname: string,
  family: number,
): Promise<void | LookupAddress | LookupAddress[]>;
function lookup(
  hostname: string,
  options: LookupOneOptions,
): Promise<void | LookupAddress | LookupAddress[]>;
function lookup(
  hostname: string,
  options: LookupAllOptions,
): Promise<void | LookupAddress | LookupAddress[]>;
function lookup(
  hostname: string,
  options: LookupOptions,
): Promise<void | LookupAddress | LookupAddress[]>;
function lookup(
  hostname: string,
  options: unknown,
): Promise<void | LookupAddress | LookupAddress[]> {
  let hints = 0;
  let family = 0;
  let all = false;
  let verbatim = getDefaultVerbatim();

  // Parse arguments
  if (hostname) {
    validateString(hostname, "hostname");
  }

  if (isFamily(options)) {
    validateOneOf(options, "family", validFamilies);
    family = options;
  } else if (!isLookupOptions(options)) {
    throw new ERR_INVALID_ARG_TYPE("options", ["integer", "object"], options);
  } else {
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

  return createLookupPromise(family, hostname, all, hints, verbatim);
}

export { lookup };

export default { lookup };
