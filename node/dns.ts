import { nextTick } from "./process.ts";
import { kCustomPromisifyArgsSymbol as customPromisifyArgs } from "./_util/_util_promisify.ts";
import {
  validateCallback,
  validateOneOf,
  validateString,
} from "./_validators.ts";
import { isIP } from "./_net.ts";
import {
  emitInvalidHostnameWarning,
  getDefaultVerbatim,
  validateHints,
} from "./_dns/_utils.ts";
import type { ErrnoException } from "./_errors.ts";
import { dnsException } from "./_errors.ts";
import {
  AI_ADDRCONFIG as ADDRCONFIG,
  getaddrinfo,
  GetAddrInfoReqWrap,
} from "./internal_binding/cares_wrap.ts";
import { toASCII } from "./_idna.ts";

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
  // deno-lint-ignore no-explicit-any
): Record<string, any>;
function lookup(
  hostname: string,
  options: LookupOneOptions,
  callback: (
    err: ErrnoException | null,
    address: string,
    family: number,
  ) => void,
  // deno-lint-ignore no-explicit-any
): Record<string, any>;
function lookup(
  hostname: string,
  options: LookupAllOptions,
  callback: (err: ErrnoException | null, addresses: LookupAddress[]) => void,
  // deno-lint-ignore no-explicit-any
): Record<string, any>;
function lookup(
  hostname: string,
  options: LookupOptions,
  callback: (
    err: ErrnoException | null,
    address: string | LookupAddress[],
    family: number,
  ) => void,
  // deno-lint-ignore no-explicit-any
): Record<string, any>;
function lookup(
  hostname: string,
  callback: (
    err: ErrnoException | null,
    address: string,
    family: number,
  ) => void,
  // deno-lint-ignore no-explicit-any
): Record<string, any>;
function lookup(
  hostname: string,
  options: unknown,
  callback?: unknown,
  // deno-lint-ignore no-explicit-any
): Record<string, any> {
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
      // deno-lint-ignore no-explicit-any
      nextTick(callback as any, null, []);
    } else {
      // deno-lint-ignore no-explicit-any
      nextTick(callback as any, null, null, family === 6 ? 6 : 4);
    }

    return {};
  }

  const matchedFamily = isIP(hostname);

  if (matchedFamily) {
    if (all) {
      nextTick(
        // deno-lint-ignore no-explicit-any
        callback as any,
        null,
        [{ address: hostname, family: matchedFamily }],
      );
    } else {
      // deno-lint-ignore no-explicit-any
      nextTick(callback as any, null, hostname, matchedFamily);
    }

    return {};
  }

  const req = new GetAddrInfoReqWrap();
  // deno-lint-ignore no-explicit-any
  req.callback = callback as any;
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

export { ADDRCONFIG, lookup };

export default {
  ADDRCONFIG,
  lookup,
};
