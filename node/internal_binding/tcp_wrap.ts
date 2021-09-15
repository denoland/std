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
import { AsyncWrap, providerType } from "./async_wrap.ts";
import { ownerSymbol } from "./symbols.ts";
import {
  UV_EADDRINUSE,
  UV_EADDRNOTAVAIL,
  UV_ECONNREFUSED,
  UV_UNKNOWN,
} from "./uv.ts";
import { delay } from "../../async/mod.ts";
import { kStreamBaseField } from "./stream_wrap.ts";

export enum socketType {
  SOCKET,
  SERVER,
}

interface AddressInfo {
  address: string;
  family?: string;
  port: number;
}

/** Initial backoff delay of 5ms following a temporary accept failure. */
const INITIAL_ACCEPT_BACKOFF_DELAY = 5;

/** Max backoff delay of 1s following a temporary accept failure. */
const MAX_ACCEPT_BACKOFF_DELAY = 1000;

function _ceilPowOf2(n: number) {
  const roundPowOf2 = 1 << 31 - Math.clz32(n);

  return roundPowOf2 < n ? roundPowOf2 * 2 : roundPowOf2;
}

export class TCP extends ConnectionWrap {
  [ownerSymbol]: unknown = null;
  reading = false;

  #address?: string;
  #port?: number;

  #remoteAddress?: string;
  #remoteFamily?: string;
  #remotePort?: number;

  #backlog?: number;
  #listener!: Deno.Listener;
  #connections: Set<TCP> = new Set();

  #closed = false;
  #acceptBackoffDelay?: number;

  constructor(type: number, object?: Deno.Reader & Deno.Writer & Deno.Closer) {
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

    super(provider, object);
  }

  onClose() {
    this.#closed = true;
    this.reading = false;

    this.#address = undefined;
    this.#port = undefined;

    this.#remoteAddress = undefined;
    this.#remoteFamily = undefined;
    this.#remotePort = undefined;

    this.#backlog = undefined;
    this.#acceptBackoffDelay = undefined;

    for (const connection of this.#connections) {
      try {
        connection.close();
        connection[kStreamBaseField]!.close();
      } catch {
        // connection already closed
      }
    }

    this.#connections.clear();

    try {
      this.#listener.close();
    } catch {
      // listener already closed
    }
  }

  open(_fd: number): number {
    // REF: https://github.com/denoland/deno/issues/6529
    notImplemented();
  }

  #bind(address: string, port: number, _flags: number): number {
    // Deno doesn't currently separate bind from connect. For now we noop under
    // the assumption we will connect shortly.
    // REF: https://doc.deno.land/builtin/stable#Deno.connect
    //
    // This also means we won't be connecting from the specified local address
    // and port as providing these is not an option in Deno.
    // REF: https://doc.deno.land/builtin/stable#Deno.ConnectOptions
    this.#address = address;
    this.#port = port;

    return 0;
  }

  // IPv4 bind
  bind(address: string, port: number): number {
    return this.#bind(address, port, 0);
  }

  // IPv6 bind
  bind6(address: string, port: number, flags: number): number {
    return this.#bind(address, port, flags);
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
      const address = conn.localAddr as Deno.NetAddr;

      this.#address = req.localAddress = address.hostname;
      this.#port = req.localPort = address.port;

      this.afterConnect(req, 0);
    }, () => {
      // TODO(cmorten): correct mapping of connection error to status code.
      this.afterConnect(req, UV_ECONNREFUSED);
    });

    return 0;
  }

  connect(req: TCPConnectWrap, address: string, port: number): number {
    return this.#connect(req, address, port);
  }

  connect6(req: TCPConnectWrap, address: string, port: number): number {
    return this.#connect(req, address, port);
  }

  async #acceptBackoff() {
    // Backoff after transient errors to allow time for the system to
    // recover, and avoid blocking up the event loop with a continuously
    // running loop.
    if (!this.#acceptBackoffDelay) {
      this.#acceptBackoffDelay = INITIAL_ACCEPT_BACKOFF_DELAY;
    } else {
      this.#acceptBackoffDelay *= 2;
    }

    if (this.#acceptBackoffDelay >= MAX_ACCEPT_BACKOFF_DELAY) {
      this.#acceptBackoffDelay = MAX_ACCEPT_BACKOFF_DELAY;
    }

    await delay(this.#acceptBackoffDelay);

    this.#accept();
  }

  async #accept(): Promise<void> {
    if (this.#closed) {
      return;
    }

    if (this.#connections.size > this.#backlog!) {
      return this.#acceptBackoff();
    }

    let connection: Deno.Conn;

    try {
      connection = await this.#listener.accept();
    } catch {
      // TODO(cmorten): map errors to appropriate error codes.
      this.onconnection!(UV_UNKNOWN, undefined);

      return this.#acceptBackoff();
    }

    this.#acceptBackoffDelay = undefined;

    const connectionHandle = new TCP(socketType.SOCKET, connection);
    this.#connections.add(connectionHandle);
    this.onconnection!(0, connectionHandle);

    return this.#accept();
  }

  listen(backlog: number): number {
    this.#backlog = _ceilPowOf2(backlog + 1);

    const listenOptions = {
      hostname: this.#address!,
      port: this.#port!,
      transport: "tcp" as const,
    };

    let listener;

    try {
      listener = Deno.listen(listenOptions);
    } catch (e) {
      if (e instanceof Deno.errors.AddrInUse) {
        return UV_EADDRINUSE;
      } else if (e instanceof Deno.errors.AddrNotAvailable) {
        return UV_EADDRNOTAVAIL;
      }

      return UV_UNKNOWN;
    }

    const address = listener.addr as Deno.NetAddr;
    this.#address = address.hostname;
    this.#port = address.port;

    this.#listener = listener;
    this.#accept();

    return 0;
  }

  getsockname(sockname: Record<string, never> | AddressInfo): number {
    if (
      typeof this.#address === "undefined" || typeof this.#port === "undefined"
    ) {
      return UV_EADDRNOTAVAIL;
    }

    sockname.address = this.#address;
    sockname.port = this.#port;

    return 0;
  }

  getpeername(peername: Record<string, never> | AddressInfo): number {
    if (
      typeof this.#remoteAddress === "undefined" ||
      typeof this.#remotePort === "undefined"
    ) {
      return UV_EADDRNOTAVAIL;
    }

    peername.address = this.#remoteAddress;
    peername.family = this.#remoteFamily;
    peername.port = this.#remotePort;

    return 0;
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

export class TCPConnectWrap extends AsyncWrap {
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

  constructor() {
    super(providerType.TCPCONNECTWRAP);
  }
}

export enum constants {
  SOCKET = socketType.SOCKET,
  SERVER = socketType.SERVER,
  UV_TCP_IPV6ONLY,
}
