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

// This module implements:
// - https://github.com/nodejs/node/blob/master/src/connection_wrap.h
// - https://github.com/nodejs/node/blob/master/src/connection_wrap.cc

import { TCPConnectWrap } from "./tcp_wrap.ts";
import { PipeConnectWrap } from "./pipe_wrap.ts";
import { ownerSymbol } from "../_async_hooks.ts";

export class ConnectionWrap {
  // deno-lint-ignore no-explicit-any
  [ownerSymbol]: any = null;
  provider: string;

  onconnection: ((status: number, handle: ConnectionWrap) => void) | null =
    null;

  constructor(provider: string) {
    this.provider = provider;
  }

  afterConnect(req: TCPConnectWrap, status: number): void;
  afterConnect(req: PipeConnectWrap, status: number): void;
  afterConnect(req: unknown, status: number): void {
    const readable = !!status;
    const writable = !!status;

    // deno-lint-ignore no-explicit-any
    return (req as any).oncomplete(status, this, req, readable, writable);
  }
}
