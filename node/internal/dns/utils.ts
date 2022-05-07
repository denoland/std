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

import { getOptionValue } from "../options.ts";
import { emitWarning } from "../../process.ts";
import {
  AI_ADDRCONFIG,
  AI_ALL,
  AI_V4MAPPED,
} from "../../internal_binding/ares.ts";
import {
  ChannelWrap,
  QueryReqWrap,
  strerror,
} from "../../internal_binding/cares_wrap.ts";
import {
  ERR_DNS_SET_SERVERS_FAILED,
  ERR_INVALID_ARG_VALUE,
  ERR_INVALID_IP_ADDRESS,
} from "../errors.ts";
import type { ErrnoException } from "../errors.ts";
import {
  validateArray,
  validateInt32,
  validateOneOf,
  validateString,
} from "../validators.mjs";
import { isIP } from "../net.ts";
import { unreachable } from "../../../testing/asserts.ts";

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
  address: string | null;
  family: number;
}

export function isLookupOptions(
  options: unknown,
): options is LookupOptions | undefined {
  return typeof options === "object" || typeof options === "undefined";
}

export function isLookupCallback(
  options: unknown,
): options is (...args: unknown[]) => void {
  return typeof options === "function";
}

export function isFamily(options: unknown): options is number {
  return typeof options === "number";
}

export interface ResolveTtlAddress {
  address: string;
  ttl: number;
}

export type Resolve4Addresses = ResolveTtlAddress[] | string[];
export type Resolve6Addresses = ResolveTtlAddress[] | string[];

export type ResolveCnameAddresses = string[];

export interface ResolveCaaAddress {
  critical: number;
  iodef?: string;
  issue?: string;
}

export type ResolveCaaAddresses = ResolveCaaAddress[];

export interface ResolveMxAddress {
  priority: number;
  exchange: string;
}

export type ResolveMxAddresses = ResolveMxAddress[];

export interface ResolveNaptrAddress {
  flags: string;
  service: string;
  regexp: string;
  replacement: string;
  order: number;
  preference: number;
}

export type ResolveNaptrAddresses = ResolveNaptrAddress[];
export type ResolveNsAddresses = string[];
export type ResolvePtrAddresses = string[];

export interface ResolveSoaAddress {
  nsname: string;
  hostmaster: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minttl: number;
}

export interface ResolveSrvRecord {
  priority: number;
  weight: number;
  port: number;
  name: string;
}

export type ResolveSrvRecords = ResolveSrvRecord[];
export type ResolveTxtRecords = string[][];
export type ResolveHostnames = string[];

export type ResolveRecords =
  | Resolve4Addresses
  | Resolve6Addresses
  | ResolveCnameAddresses
  | ResolveCaaAddresses
  | ResolveMxAddresses
  | ResolveNaptrAddresses
  | ResolveNsAddresses
  | ResolvePtrAddresses
  | ResolveSoaAddress
  | ResolveSrvRecords
  | ResolveTxtRecords
  | ResolveHostnames;

export type ResolveCallback = (
  err: ErrnoException | null,
  ret?: ResolveRecords,
) => void;

export type Resolve4Callback = (
  err: ErrnoException | null,
  addresses?: Resolve4Addresses,
) => void;

export type Resolve6Callback = (
  err: ErrnoException | null,
  addresses?: Resolve6Addresses,
) => void;

export type ResolveCnameCallback = (
  err: ErrnoException | null,
  addresses?: ResolveCnameAddresses,
) => void;

export type ResolveCaaCallback = (
  err: ErrnoException | null,
  addresses?: ResolveCaaAddresses,
) => void;

export type ResolveMxCallback = (
  err: ErrnoException | null,
  addresses?: ResolveMxAddresses,
) => void;

export type ResolveNaptrCallback = (
  err: ErrnoException | null,
  addresses?: ResolveNaptrAddresses,
) => void;

export type ResolveNsCallback = (
  err: ErrnoException | null,
  addresses?: ResolveNsAddresses,
) => void;

export type ResolvePtrCallback = (
  err: ErrnoException | null,
  addresses?: ResolvePtrAddresses,
) => void;

export type ResolveSoaCallback = (
  err: ErrnoException | null,
  address?: ResolveSoaAddress,
) => void;

export type ResolveSrvCallback = (
  err: ErrnoException | null,
  records?: ResolveSrvRecords,
) => void;

export type ResolveTxtCallback = (
  err: ErrnoException | null,
  records?: ResolveTxtRecords,
) => void;

export type ReverseCallback = (
  err: ErrnoException | null,
  hostnames?: ResolveHostnames,
) => void;

export function isResolverOptions(
  options: unknown,
): options is Record<string, unknown> {
  return typeof options === "object";
}

const IANA_DNS_PORT = 53;
const IPv6RE = /^\[([^[\]]*)\]/;
const addrSplitRE = /(^.+?)(?::(\d+))?$/;

function validateTimeout(options?: { timeout?: number }) {
  const { timeout = -1 } = { ...options };
  validateInt32(timeout, "options.timeout", -1, 2 ** 31 - 1);
  return timeout;
}

function validateTries(options?: { tries?: number }) {
  const { tries = 4 } = { ...options };
  validateInt32(tries, "options.tries", 1, 2 ** 31 - 1);
  return tries;
}

// Resolver instances correspond 1:1 to c-ares channels.
export class Resolver {
  _handle!: ChannelWrap;

  constructor(options?: { timeout?: number; tries?: number }) {
    const timeout = validateTimeout(options);
    const tries = validateTries(options);
    this._handle = new ChannelWrap(timeout, tries);
  }

  cancel() {
    this._handle.cancel();
  }

  getServers() {
    return this._handle.getServers().map((val: [string, number]) => {
      if (!val[1] || val[1] === IANA_DNS_PORT) {
        return val[0];
      }

      const host = isIP(val[0]) === 6 ? `[${val[0]}]` : val[0];
      return `${host}:${val[1]}`;
    });
  }

  setServers(servers: string[]) {
    validateArray(servers, "servers");

    // Cache the original servers because in the event of an error while
    // setting the servers, c-ares won't have any servers available for
    // resolution.
    const orig = this._handle.getServers();
    const newSet: [number, string, number][] = [];

    servers.forEach((serv, index) => {
      validateString(serv, `servers[${index}]`);
      let ipVersion = isIP(serv);

      if (ipVersion !== 0) {
        return newSet.push([ipVersion, serv, IANA_DNS_PORT]);
      }

      const match = serv.match(IPv6RE);

      // Check for an IPv6 in brackets.
      if (match) {
        ipVersion = isIP(match[1]);

        if (ipVersion !== 0) {
          const port = Number.parseInt(serv.replace(addrSplitRE, "$2")) ||
            IANA_DNS_PORT;
          return newSet.push([ipVersion, match[1], port]);
        }
      }

      // addr::port
      const addrSplitMatch = serv.match(addrSplitRE);

      if (addrSplitMatch) {
        const hostIP = addrSplitMatch[1];
        const port = addrSplitMatch[2] || `${IANA_DNS_PORT}`;

        ipVersion = isIP(hostIP);

        if (ipVersion !== 0) {
          return newSet.push([ipVersion, hostIP, Number.parseInt(port)]);
        }
      }

      throw new ERR_INVALID_IP_ADDRESS(serv);
    });

    const errorNumber = this._handle.setServers(newSet);

    if (errorNumber !== 0) {
      // Reset the servers to the old servers, because ares probably unset them.
      this._handle.setServers(orig.join(","));
      const err = strerror(errorNumber);
      throw new ERR_DNS_SET_SERVERS_FAILED(err, servers.toString());
    }
  }

  setLocalAddress(ipv4: string, ipv6: string) {
    validateString(ipv4, "ipv4");

    if (ipv6 !== undefined) {
      validateString(ipv6, "ipv6");
    }

    this._handle.setLocalAddress(ipv4, ipv6);
  }

  resolveAny(_name: string, _callback: ResolveCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolve4(_name: string, _callback: Resolve4Callback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolve6(_name: string, _callback: Resolve6Callback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolveCaa(_name: string, _callback: ResolveCaaCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolveCname(_name: string, _callback: ResolveCnameCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolveMx(_name: string, _callback: ResolveMxCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolveNs(_name: string, _callback: ResolveNsCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolveTxt(_name: string, _callback: ResolveTxtCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolveSrv(_name: string, _callback: ResolveSrvCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolvePtr(_name: string, _callback: ResolvePtrCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolveNaptr(_name: string, _callback: ResolveNaptrCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolveSoa(_name: string, _callback: ResolveSoaCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  reverse(_ip: string, _callback: ReverseCallback): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }

  resolve(
    _hostname: string,
    _rrtype: string,
    _callback: ResolveCallback,
  ): QueryReqWrap {
    // Expect to be overridden by specific Resolver implementation.
    unreachable();
  }
}

let defaultResolver = new Resolver();

export function getDefaultResolver(): Resolver {
  return defaultResolver;
}

export function setDefaultResolver<T extends Resolver>(resolver: T) {
  defaultResolver = resolver;
}

export function validateHints(hints: number) {
  if ((hints & ~(AI_ADDRCONFIG | AI_ALL | AI_V4MAPPED)) !== 0) {
    throw new ERR_INVALID_ARG_VALUE("hints", hints, "is invalid");
  }
}

let invalidHostnameWarningEmitted = false;

export function emitInvalidHostnameWarning(hostname: string) {
  if (invalidHostnameWarningEmitted) {
    return;
  }

  invalidHostnameWarningEmitted = true;

  emitWarning(
    `The provided hostname "${hostname}" is not a valid ` +
      "hostname, and is supported in the dns module solely for compatibility.",
    "DeprecationWarning",
    "DEP0118",
  );
}

let dnsOrder = getOptionValue("--dns-result-order") || "ipv4first";

export function getDefaultVerbatim() {
  switch (dnsOrder) {
    case "verbatim": {
      return true;
    }
    case "ipv4first": {
      return false;
    }
    default: {
      return false;
    }
  }
}

export function setDefaultResultOrder(order: string) {
  validateOneOf(order, "dnsOrder", ["verbatim", "ipv4first"]);
  dnsOrder = order;
}

export function defaultResolverSetServers(servers: string[]) {
  const resolver = new Resolver();

  resolver.setServers(servers);
  setDefaultResolver(resolver);
}
