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

// This module ports:
// - https://github.com/nodejs/node/blob/master/src/cares_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/cares_wrap.h

import type { ErrnoException } from "../internal/errors.ts";
import { isIPv4 } from "../internal/net.ts";
import { codeMap } from "./uv.ts";
import { AsyncWrap, providerType } from "./async_wrap.ts";
import { ares_strerror } from "./ares.ts";
import { notImplemented } from "../_utils.ts";
import { isWindows } from "../../_util/os.ts";

interface LookupAddress {
  address: string;
  family: number;
}

export class GetAddrInfoReqWrap extends AsyncWrap {
  family!: number;
  hostname!: string;

  callback!: (
    err: ErrnoException | null,
    addressOrAddresses?: string | LookupAddress[] | null,
    family?: number,
  ) => void;
  resolve!: (addressOrAddresses: LookupAddress | LookupAddress[]) => void;
  reject!: (err: ErrnoException | null) => void;
  oncomplete!: (err: number | null, addresses: string[]) => void;

  constructor() {
    super(providerType.GETADDRINFOREQWRAP);
  }
}

export function getaddrinfo(
  req: GetAddrInfoReqWrap,
  hostname: string,
  family: number,
  _hints: number,
  verbatim: boolean,
): number {
  let addresses: string[] = [];

  // TODO(cmorten): use hints
  // REF: https://nodejs.org/api/dns.html#dns_supported_getaddrinfo_flags

  const recordTypes: ("A" | "AAAA")[] = [];

  if (family === 0 || family === 4) {
    recordTypes.push("A");
  }
  if (family === 0 || family === 6) {
    recordTypes.push("AAAA");
  }

  (async () => {
    await Promise.allSettled(
      recordTypes.map((recordType) =>
        Deno.resolveDns(hostname, recordType).then((records) => {
          records.forEach((record) => addresses.push(record));
        })
      ),
    );

    const error = addresses.length ? 0 : codeMap.get("EAI_NODATA")!;

    // TODO(cmorten): needs work
    // REF: https://github.com/nodejs/node/blob/master/src/cares_wrap.cc#L1444
    if (!verbatim) {
      addresses.sort((a: string, b: string): number => {
        if (isIPv4(a)) {
          return -1;
        } else if (isIPv4(b)) {
          return 1;
        }

        return 0;
      });
    }

    // TODO: Forces IPv4 as a workaround for Deno not
    // aligning with Node on implicit binding on Windows
    // REF: https://github.com/denoland/deno/issues/10762
    if (isWindows && hostname === "localhost") {
      addresses = addresses.filter((address) => isIPv4(address));
    }

    req.oncomplete(error, addresses);
  })();

  return 0;
}

export class QueryReqWrap extends AsyncWrap {
  bindingName!: string;
  hostname!: string;
  ttl!: boolean;

  callback!: (
    err: ErrnoException | null,
    // deno-lint-ignore no-explicit-any
    addressAddressesOrRecords?: any,
  ) => void;
  resolve!: (addresses: string[], ttls?: number[]) => void;
  reject!: (err: ErrnoException | null) => void;
  oncomplete!: (err: number, addresses: string[], ttls?: number[]) => void;

  constructor() {
    super(providerType.QUERYWRAP);
  }
}

export interface ChannelWrapQuery {
  queryAny(req: QueryReqWrap, name: string): number;
  queryA(req: QueryReqWrap, name: string): number;
  queryAaaa(req: QueryReqWrap, name: string): number;
  queryCaa(req: QueryReqWrap, name: string): number;
  queryCname(req: QueryReqWrap, name: string): number;
  queryMx(req: QueryReqWrap, name: string): number;
  queryNs(req: QueryReqWrap, name: string): number;
  queryTxt(req: QueryReqWrap, name: string): number;
  querySrv(req: QueryReqWrap, name: string): number;
  queryPtr(req: QueryReqWrap, name: string): number;
  queryNaptr(req: QueryReqWrap, name: string): number;
  querySoa(req: QueryReqWrap, name: string): number;
  getHostByAddr(req: QueryReqWrap, name: string): number;
}

export class ChannelWrap extends AsyncWrap implements ChannelWrapQuery {
  #timeout: number;
  #tries: number;

  constructor(timeout: number, tries: number) {
    super(providerType.DNSCHANNEL);

    this.#timeout = timeout;
    this.#tries = tries;
  }

  async #query(req: QueryReqWrap, query: string, recordType: Deno.RecordType) {
    // deno-lint-ignore no-explicit-any
    let addresses: any[] = [];
    let error = 0;

    try {
      addresses = await Deno.resolveDns(query, recordType);
    } catch {
      // TODO(cmorten): map errors to appropriate error codes.
      error = codeMap.get("UNKNOWN")!;
    }

    req.oncomplete(error, addresses);
  }

  queryAny(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.queryAny");
  }

  queryA(req: QueryReqWrap, name: string): number {
    this.#query(req, name, "A");

    return 0;
  }

  queryAaaa(req: QueryReqWrap, name: string): number {
    this.#query(req, name, "AAAA");

    return 0;
  }

  queryCaa(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.queryCaa");
  }

  queryCname(req: QueryReqWrap, name: string): number {
    this.#query(req, name, "CNAME");

    return 0;
  }

  queryMx(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.queryMx");
  }

  queryNs(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.queryNs");
  }

  queryTxt(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.queryTxt");
  }

  querySrv(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.querySrv");
  }

  queryPtr(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.queryPtr");
  }

  queryNaptr(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.queryNaptr");
  }

  querySoa(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.querySoa");
  }

  getHostByAddr(_req: QueryReqWrap, _name: string): number {
    notImplemented("ChannelWrap.getHostByAddr");
  }

  getServers(): [string, number][] {
    notImplemented("ChannelWrap.getServers");
  }

  setServers(_servers: string | [number, string, number][]): number {
    notImplemented("ChannelWrap.setServers");
  }

  setLocalAddress(_addr0: string, _addr1?: string): void {
    notImplemented("ChannelWrap.setLocalAddress");
  }

  cancel() {
    notImplemented("ChannelWrap.cancel");
  }
}

const DNS_ESETSRVPENDING = -1000;
const EMSG_ESETSRVPENDING = "There are pending queries.";

export function strerror(code: number) {
  return code === DNS_ESETSRVPENDING
    ? EMSG_ESETSRVPENDING
    : ares_strerror(code);
}
