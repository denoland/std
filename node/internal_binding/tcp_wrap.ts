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
// - https://github.com/nodejs/node/blob/master/src/tcp_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/tcp_wrap.h

import { notImplemented } from "../_utils.ts";
import { unreachable } from "../../testing/asserts.ts";
import { ConnectionWrap } from "./connection_wrap.ts";
import { providerType } from "./async_wrap.ts";
import { ownerSymbol } from "./symbols.ts";

export enum socketType {
  SOCKET,
  SERVER,
}

export class TCP extends ConnectionWrap {
  // deno-lint-ignore no-explicit-any
  [ownerSymbol]: any = null;
  onconnection = null;
  reading = false;

  constructor(type: number) {
    let provider: providerType;

    switch (type) {
      case socketType.SOCKET: {
        provider = providerType.TCPWRAP;

        break;
      }
      case socketType.SERVER: {
        provider = providerType.TCPSERVERWRAP;

        break;
      }
      default: {
        unreachable();
      }
    }

    super(provider);
  }

  open(_fd: number): number {
    // REF: https://github.com/denoland/deno/issues/6529
    notImplemented();
  }

  #bind(_localAddress: string, _localPort: number, _flags: number): number {
    // Deno doesn't currently separate bind from connect. For now we noop under
    // the assumption we will connect shortly.
    // REF: https://doc.deno.land/builtin/stable#Deno.connect
    //
    // This also means we won't be connecting from the specified local address
    // and port as providing these is not an option in Deno.
    // REF: https://doc.deno.land/builtin/stable#Deno.ConnectOptions
    return 0;
  }

  // IPv4 bind
  bind(localAddress: string, localPort: number): number {
    return this.#bind(localAddress, localPort, 0);
  }

  // IPv6 bind
  bind6(localAddress: string, localPort: number, flags: number): number {
    return this.#bind(localAddress, localPort, flags);
  }

  #connect(req: TCPConnectWrap, address: string, port: number): number {
    const connectOptions: Deno.ConnectOptions = {
      hostname: address,
      port,
      transport: "tcp",
    };

    Deno.connect(connectOptions).then((conn: Deno.Conn) => {
      // Incorrect / backwards, but correcting the local address and port with
      // what was actually used given we can't actually specify these in Deno.
      req.localAddress = (conn?.localAddr as Deno.NetAddr).hostname;
      req.localPort = (conn?.localAddr as Deno.NetAddr).port;

      this.afterConnect(req, 0);
    }, () => {
      // TODO(cmorten): correct status based on the connection error.
      this.afterConnect(req, 1);
    });

    return 0;
  }

  connect(req: TCPConnectWrap, address: string, port: number): number {
    return this.#connect(req, address, port);
  }

  connect6(req: TCPConnectWrap, address: string, port: number): number {
    return this.#connect(req, address, port);
  }

  listen() {
    notImplemented();
  }

  getsockname(_sockname: Record<string, never>): number {
    notImplemented();
  }

  getpeername(_peername: Record<string, never>): number {
    notImplemented();
  }

  setNoDelay(_noDelay: boolean): number {
    notImplemented();
  }

  setKeepAlive(_enable: boolean, _initialDelay: number) {
    notImplemented();
  }

  /**
   * Windows only.
   *
   * Deprecated by Node.
   * REF: https://github.com/nodejs/node/blob/master/lib/net.js#L1731
   *
   * @param enable
   * @deprecated
   */
  setSimultaneousAccepts(_enable: boolean) {
    notImplemented();
  }
}

export class TCPConnectWrap {
  oncomplete!: (
    status: number,
    handle: ConnectionWrap,
    req: TCPConnectWrap,
    readable: boolean,
    writeable: boolean,
  ) => void;
  address!: string;
  port!: number;
  localAddress!: string;
  localPort!: number;
}

export enum constants {
  SOCKET = socketType.SOCKET,
  SERVER = socketType.SERVER,
  UV_TCP_IPV6ONLY,
}
