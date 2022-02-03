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

interface LookupAddress {
  address: string;
  family: number;
}

// REF: https://github.com/nodejs/node/blob/master/deps/cares/include/ares.h#L190
export const ARES_AI_CANONNAME = (1 << 0);
export const ARES_AI_NUMERICHOST = (1 << 1);
export const ARES_AI_PASSIVE = (1 << 2);
export const ARES_AI_NUMERICSERV = (1 << 3);
export const AI_V4MAPPED = (1 << 4);
export const AI_ALL = (1 << 5);
export const AI_ADDRCONFIG = (1 << 6);
export const ARES_AI_NOSORT = (1 << 7);
export const ARES_AI_ENVHOSTS = (1 << 8);

export class GetAddrInfoReqWrap extends AsyncWrap {
  callback!: (
    err: ErrnoException | null,
    addressOrAddresses?: string | LookupAddress[] | null,
    family?: number,
  ) => void;
  family!: number;
  hostname!: string;
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
) {
  (async () => {
    const addresses: string[] = [];

    // TODO(cmorten): use hints
    // REF: https://nodejs.org/api/dns.html#dns_supported_getaddrinfo_flags

    const recordTypes: ("A" | "AAAA")[] = [];

    if (family === 0 || family === 4) {
      recordTypes.push("A");
    }
    if (family === 0 || family === 6) {
      recordTypes.push("AAAA");
    }

    await Promise.allSettled(
      recordTypes.map((recordType) =>
        Deno.resolveDns(hostname, recordType).then((records) => {
          records.forEach((record) => addresses.push(record));
        })
      ),
    );

    const error = addresses.length ? null : codeMap.get("EAI_NODATA")!;

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

    req.oncomplete(error, addresses);
  })();
}
