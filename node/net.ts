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

import { EventEmitter } from "./events.ts";
import { asyncIdSymbol } from "./_async_hooks.ts";
import { ERR_INVALID_ARG_TYPE } from "./_errors.ts";
import { notImplemented } from "./_utils.ts";
import { Duplex } from "./stream.ts";

export class Socket extends Duplex {
  constructor() {
    super();
    notImplemented();
  }
}

export const Stream = Socket;

const SERVER_CONNECTION_EVENT = "connection";

type ConnectionListener = (socket: Socket) => void;

interface ServerSocketOptions {
  allowHalfOpen?: boolean;
  pauseOnConnect?: boolean;
}

function _isServerSocketOptions(
  options: unknown,
): options is null | undefined | ServerSocketOptions {
  return options === null || typeof options === "undefined" ||
    typeof options === "object";
}

function _isConnectionListener(
  connectionListener: unknown,
): connectionListener is ConnectionListener {
  return typeof connectionListener === "function";
}

/** This class is used to create a TCP or IPC server. */
export class Server extends EventEmitter {
  #connections: number;
  #handle: unknown;
  #usingWorkers: boolean;
  #workers: unknown[];
  #unref: boolean;
  [asyncIdSymbol]: number;
  allowHalfOpen = false;
  pauseOnConnect = false;

  /**
   * `net.Server` is an `EventEmitter` with the following events:
   *
   * - `"close"` - Emitted when the server closes. If connections exist, this
   * event is not emitted until all connections are ended.
   * - `"connection"` - Emitted when a new connection is made. `socket` is an
   * instance of `net.Socket`.
   * - `"error"` - Emitted when an error occurs. Unlike `net.Socket`, the
   * `"close"` event will not be emitted directly following this event unless
   * `server.close()` is manually called. See the example in discussion of
   * `server.listen()`.
   * - `"listening"` - Emitted when the server has been bound after calling
   * `server.listen()`.
   */
  constructor(
    options?: ServerSocketOptions | ConnectionListener,
    connectionListener?: ConnectionListener,
  ) {
    super();

    if (_isConnectionListener(options)) {
      this.on(SERVER_CONNECTION_EVENT, options);
    } else if (_isServerSocketOptions(options)) {
      this.allowHalfOpen = options?.allowHalfOpen || false;
      this.pauseOnConnect = !!options?.pauseOnConnect;

      if (_isConnectionListener(connectionListener)) {
        this.on(SERVER_CONNECTION_EVENT, connectionListener);
      }
    } else {
      throw new ERR_INVALID_ARG_TYPE("options", "Object", options);
    }

    this.#connections = 0;

    this[asyncIdSymbol] = -1;
    this.#handle = null;
    this.#usingWorkers = false;
    this.#workers = [];
    this.#unref = false;
  }

  _listen2() {
    notImplemented();
  }

  listen(..._args: unknown[]) {
    notImplemented();
  }

  address() {
    notImplemented();
  }

  getConnections(_cb: (err: Error | null, connections: number) => void) {
    notImplemented();
  }

  close(_cb?: (err?: Error) => void) {
    notImplemented();
  }

  _emitClosedIfDrained() {
    notImplemented();
  }

  _setupWorker(_socketList: EventEmitter) {
    notImplemented();
  }

  ref() {
    notImplemented();
  }

  unref() {
    notImplemented();
  }
}

/**
 * Creates a new TCP or IPC server.
 *
 * Accepts an `options` object with properties `allowHalfOpen` (default `false`)
 * and `pauseOnConnect` (default `false`).
 *
 * If `allowHalfOpen` is set to `false`, then the socket will
 * automatically end the writable side when the readable side ends.
 *
 * If `allowHalfOpen` is set to `true`, when the other end of the socket
 * signals the end of transmission, the server will only send back the end of
 * transmission when `socket.end()` is explicitly called. For example, in the
 * context of TCP, when a FIN packed is received, a FIN packed is sent back
 * only when `socket.end()` is explicitly called. Until then the connection is
 * half-closed (non-readable but still writable). See `"end"` event and RFC 1122
 * (section 4.2.2.13) for more information.
 *
 * `pauseOnConnect` indicates whether the socket should be paused on incoming
 * connections.
 *
 * If `pauseOnConnect` is set to `true`, then the socket associated with each
 * incoming connection will be paused, and no data will be read from its
 * handle. This allows connections to be passed between processes without any
 * data being read by the original process. To begin reading data from a paused
 * socket, call `socket.resume()`.
 *
 * The server can be a TCP server or an IPC server, depending on what it
 * `listen()` to.
 *
 * Here is an example of an TCP echo server which listens for connections on
 * port 8124:
 *
 * ```ts
 * import { createRequire } from "https://deno.land/std@$STD_VERSION/node/module.ts";
 *
 * const require = createRequire(import.meta.url);
 * const net = require("net");
 *
 * const server = net.createServer((c) => {
 *   // "connection" listener.
 *   console.log("client connected");
 *   c.on("end", () => {
 *     console.log("client disconnected");
 *   });
 *   c.write("hello\r\n");
 *   c.pipe(c);
 * });
 *
 * server.on("error", (err) => {
 *   throw err;
 * });
 *
 * server.listen(8124, () => {
 *   console.log("server bound");
 * });
 * ```
 *
 * Test this by using `telnet`:
 *
 * ```console
 * $ telnet localhost 8124
 * ```
 *
 * @param options Socket options.
 * @param connectionListener Automatically set as a listener for the `"connection"` event.
 * @return A `net.Server`.
 */
export function createServer(
  options?: ServerSocketOptions,
  connectionListener?: ConnectionListener,
): Server {
  return new Server(options, connectionListener);
}
