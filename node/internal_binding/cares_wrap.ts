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

import type { ErrnoException } from "../_errors.ts";
import { isIPv4 } from "../_net.ts";
import { UV_EAI_NODATA } from "./uv.ts";

enum constants {
  AF_INET = 1,
  AF_INET6,
  AF_UNSPEC,
  AI_ADDRCONFIG,
  AI_ALL,
  AI_V4MAPPED,
}

export const AI_ADDRCONFIG = constants.AI_ADDRCONFIG as number;
export const AI_ALL = constants.AI_ALL as number;
export const AI_V4MAPPED = constants.AI_V4MAPPED as number;

export class GetAddrInfoReqWrap {
  callback!: (
    err: ErrnoException | null,
    addressOrAddresses?: string | { address: string; family: number }[],
    family?: number,
  ) => void;
  family!: number;
  hostname!: string;
  oncomplete!: (err: number | null, addresses: string[]) => void;
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
        Deno.resolveDns(hostname, recordType).then(
          (records) => addresses.concat(records),
          () => {},
        )
      ),
    );

    const error = addresses.length ? null : UV_EAI_NODATA;

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
