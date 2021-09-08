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
import { isIP, isIPv4, isIPv6 } from "./_net/_net_ip.ts";
import type { DuplexOptions } from "./_stream/duplex.ts";
import type { WritableEncodings } from "./_stream/writable.ts";
import { Duplex } from "./stream.ts";
import {
  asyncIdSymbol,
  defaultTriggerAsyncIdScope,
  newAsyncId,
  ownerSymbol,
} from "./_async_hooks.ts";
import { ERR_INVALID_ARG_TYPE, errnoException, NodeError } from "./_errors.ts";
import { Encodings, notImplemented } from "./_utils.ts";
import { isUint8Array } from "./_util/_util_types.ts";
import {
  kAfterAsyncWrite,
  kBuffer,
  kBufferCb,
  kBufferGen,
  kHandle,
  kUpdateTimer,
  onStreamRead,
} from "./_stream_base_commons.ts";
import { kTimeout } from "./_timers.ts";
import { nextTick } from "./process.ts";
import { DTRACE_NET_STREAM_END } from "./_dtrace.ts";
import { Buffer } from "./buffer.ts";

const kLastWriteQueueSize = Symbol("lastWriteQueueSize");
const kSetNoDelay = Symbol("kSetNoDelay");

interface Handle {
  [ownerSymbol]: Socket;
  reading: boolean;
  bytesRead: number;
  bytesWritten: number;
  getAsyncId?: unknown;
  onread?: unknown;
  getpeername?: (peername: unknown) => unknown;
  getsockname?: (sockname: unknown) => unknown;
  ref?: () => unknown;
  unref?: () => unknown;
  readStart(): Error | undefined;
  readStop(): Error | undefined;
  useUserBuffer(userBuf: true | Uint8Array): unknown;
}

interface SocketOptions extends DuplexOptions {
  /**
   * If specified, wrap around an existing socket with the given file
   * descriptor, otherwise a new socket will be created.
   */
  fd?: number;
  /**
   * If set to `false`, then the socket will automatically end the writable
   * side when the readable side ends. See `net.createServer()` and the `"end"`
   * event for details. Default: `false`.
   */
  allowHalfOpen?: boolean;
  /**
   * Allow reads on the socket when an fd is passed, otherwise ignored.
   * Default: `false`.
   */
  readable?: boolean;
  /**
   * Allow writes on the socket when an fd is passed, otherwise ignored.
   * Default: `false`.
   */
  writable?: boolean;
  /** An Abort signal that may be used to destroy the socket. */
  signal?: AbortSignal;

  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}

function getNewAsyncId(handle?: Handle | null) {
  return (!handle || typeof handle.getAsyncId !== "function")
    ? newAsyncId()
    : handle.getAsyncId();
}

const kBytesRead = Symbol("kBytesRead");
const kBytesWritten = Symbol("kBytesWritten");

export class Socket extends Duplex {
  connecting = false;
  // Problem with this is that users can supply their own handle, that may not
  // have `handle.getAsyncId()`. In this case an `[asyncIdSymbol]` should
  // probably be supplied by `async_hooks`.
  [asyncIdSymbol] = -1;
  [kHandle]: Handle | null = null;
  [kSetNoDelay] = false;
  [kLastWriteQueueSize] = 0;
  [kTimeout] = null;
  [kBuffer]: Uint8Array | boolean | null = null;
  // deno-lint-ignore ban-types
  [kBufferCb]: Function | null = null;
  // deno-lint-ignore ban-types
  [kBufferGen]: Function | null = null;
  [kBytesRead]: number;
  [kBytesWritten]: number;

  server: unknown;

  _peername?: { address?: string; family?: string; port?: number } | null;
  _sockname?: { address?: string; port?: number } | null;
  _pendingData: unknown;
  _pendingEncoding: string;
  _server: unknown;

  constructor(options: number | SocketOptions) {
    if (typeof options === "number") {
      // Legacy interface.
      options = { fd: options } as SocketOptions;
    } else {
      options = { ...options };
    }

    // Default to *not* allowing half open sockets.
    options.allowHalfOpen = Boolean(options.allowHalfOpen);
    // For backwards compat do not emit close on destroy.
    options.emitClose = false;
    options.autoDestroy = true;
    // Handle strings directly.
    options.decodeStrings = false;

    super(options);

    if (options.handle) {
      this._handle = options.handle;
      this[asyncIdSymbol] = getNewAsyncId(this._handle);
    } else if (options.fd !== undefined) {
      // TODO(cmorten): deal with file descriptors, using `Deno.resources()`?
      notImplemented();
    }

    const onread = options.onread;

    if (
      onread !== null && typeof onread === "object" &&
      (isUint8Array(onread.buffer) || typeof onread.buffer === "function") &&
      typeof onread.callback === "function"
    ) {
      if (typeof onread.buffer === "function") {
        this[kBuffer] = true;
        this[kBufferGen] = onread.buffer;
      } else {
        this[kBuffer] = onread.buffer;
      }

      this[kBufferCb] = onread.callback;
    }

    this.on("end", this.#onReadableStreamEnd);

    this.#initSocketHandle();

    this._pendingData = null;
    this._pendingEncoding = "";

    // If we have a handle, then start the flow of data into the
    // buffer.  if not, then this will happen when we connect
    if (this._handle && options.readable !== false) {
      if (options.pauseOnCreate) {
        // Stop the handle from reading and pause the stream
        this._handle.reading = false;
        this._handle.readStop();
        this.readableFlowing = false;
      } else if (!options.manualStart) {
        this.read(0);
      }
    }

    // Reserve properties
    this.server = null;
    this._server = null;

    // Used after `.destroy()`
    this[kBytesRead] = 0;
    this[kBytesWritten] = 0;
  }

  _unrefTimer() {
    notImplemented();
  }

  _final = (_cb: unknown) => {
    notImplemented();
  };

  setTimeout() {
    notImplemented();
  }

  _onTimeout() {
    notImplemented();
  }

  setNoDelay(_enable: boolean) {
    notImplemented();
  }

  setKeepAlive(_setting: unknown, _msecs: unknown) {
    notImplemented();
  }

  address() {
    notImplemented();
  }

  get _connecting() {
    return this.connecting;
  }

  get pending() {
    return !this._handle || this.connecting;
  }

  get readyState() {
    if (this.connecting) {
      return "opening";
    } else if (this.readable && this.writable) {
      return "open";
    } else if (this.readable && !this.writable) {
      return "readOnly";
    } else if (!this.readable && this.writable) {
      return "writeOnly";
    }
    return "closed";
  }

  get bufferSize() {
    if (this._handle) {
      return this.writableLength;
    }

    return undefined;
  }

  get [kUpdateTimer]() {
    return this._unrefTimer;
  }

  _read = (n?: number) => {
    if (this.connecting || !this._handle) {
      this.once("connect", () => this._read(n));
    } else if (!this._handle.reading) {
      this.#tryReadStart();
    }
  };

  end(
    // deno-lint-ignore no-explicit-any
    data?: any | (() => void),
    encoding?: Encodings | (() => void),
    callback?: () => void,
  ) {
    // deno-lint-ignore no-explicit-any
    Duplex.prototype.end.call(this, data, encoding as any, callback);
    DTRACE_NET_STREAM_END(this);

    return this;
  }

  pause = () => {
    if (
      this[kBuffer] && !this.connecting && this._handle &&
      this._handle.reading
    ) {
      this._handle.reading = false;

      if (!this.destroyed) {
        const err = this._handle.readStop();

        if (err) {
          this.destroy(errnoException(err, "read"));
        }
      }
    }

    return Duplex.prototype.pause.call(this) as unknown as this;
  };

  resume = () => {
    if (
      this[kBuffer] && !this.connecting && this._handle &&
      !this._handle.reading
    ) {
      this.#tryReadStart();
    }

    return Duplex.prototype.resume.call(this) as unknown as this;
  };

  read = (n?: number) => {
    if (
      this[kBuffer] && !this.connecting && this._handle &&
      !this._handle.reading
    ) {
      this.#tryReadStart();
    }

    return Duplex.prototype.read.call(this, n);
  };

  destroySoon = () => {
    if (this.writable) {
      this.end();
    }

    if (this.writableFinished) {
      this.destroy();
    } else {
      this.once("finish", this.destroy);
    }
  };

  _destroy(_exception: unknown, _cb: unknown) {
    notImplemented();
  }

  _getpeername() {
    if (!this._handle || !this._handle.getpeername) {
      return this._peername || {};
    } else if (!this._peername) {
      this._peername = {};
      this._handle.getpeername(this._peername);
    }

    return this._peername;
  }

  get bytesRead() {
    return this._handle ? this._handle.bytesRead : this[kBytesRead];
  }

  get remoteAddress() {
    return this._getpeername().address;
  }

  get remoteFamily() {
    return this._getpeername().family;
  }

  get remotePort() {
    return this._getpeername().port;
  }

  _getsockname() {
    if (!this._handle || !this._handle.getsockname) {
      return {};
    } else if (!this._sockname) {
      this._sockname = {};
      this._handle.getsockname(this._sockname);
    }

    return this._sockname;
  }

  get localAddress() {
    return this._getsockname().address;
  }

  get localPort() {
    return this._getsockname().port;
  }

  [kAfterAsyncWrite]() {
    this[kLastWriteQueueSize] = 0;
  }

  _writeGeneric(
    _writev: boolean,
    _data: unknown,
    _encoding: unknown,
    _cb: unknown,
  ) {
    notImplemented();
  }

  _writev = (
    // deno-lint-ignore no-explicit-any
    chunks: Array<{ chunk: any; encoding: string }>,
    cb: (error?: Error | null) => void,
  ) => {
    this._writeGeneric(true, chunks, "", cb);
  };

  _write = (
    // deno-lint-ignore no-explicit-any
    data: any,
    encoding: string,
    cb: (error?: Error | null) => void,
  ) => {
    this._writeGeneric(false, data, encoding, cb);
  };

  // Legacy alias. Having this is probably being overly cautious, but it doesn't
  // really hurt anyone either. This can probably be removed safely if desired.
  get _bytesDispatched() {
    return this._handle ? this._handle.bytesWritten : this[kBytesWritten];
  }

  get bytesWritten() {
    let bytes = this._bytesDispatched;
    const data = this._pendingData;
    const encoding = this._pendingEncoding;
    const writableBuffer = this.writableBuffer;

    if (!writableBuffer) {
      return undefined;
    }

    for (const el of writableBuffer) {
      bytes += el.chunk instanceof Buffer
        ? el.chunk.length
        : Buffer.byteLength(el.chunk, el.encoding);
    }

    if (Array.isArray(data)) {
      // Was a writev, iterate over chunks to get total length
      for (let i = 0; i < data.length; i++) {
        const chunk = data[i];

        // deno-lint-ignore no-explicit-any
        if ((data as any).allBuffers || chunk instanceof Buffer) {
          bytes += chunk.length;
        } else {
          bytes += Buffer.byteLength(chunk.chunk, chunk.encoding);
        }
      }
    } else if (data) {
      // Writes are either a string or a Buffer.
      if (typeof data !== "string") {
        bytes += (data as Buffer).length;
      } else {
        bytes += Buffer.byteLength(data, encoding);
      }
    }

    return bytes;
  }

  connect(..._args: unknown[]) {
    notImplemented();
  }

  ref() {
    if (!this._handle) {
      this.once("connect", this.ref);
      return this;
    }

    if (typeof this._handle.ref === "function") {
      this._handle.ref();
    }

    return this;
  }

  unref() {
    if (!this._handle) {
      this.once("connect", this.unref);
      return this;
    }

    if (typeof this._handle.unref === "function") {
      this._handle.unref();
    }

    return this;
  }

  get _handle(): Handle | null {
    return this[kHandle];
  }

  set _handle(v: Handle | null) {
    this[kHandle] = v;
  }

  #tryReadStart() {
    // Not already reading, start the flow
    this._handle!.reading = true;
    const err = this._handle!.readStart();
    if (err) {
      this.destroy(errnoException(err, "read"));
    }
  }

  // Provide a better error message when we call end() as a result
  // of the other side sending a FIN.  The standard 'write after end'
  // is overly vague, and makes it seem like the user's code is to blame.
  #writeAfterFIN(
    // deno-lint-ignore no-explicit-any
    chunk: any,
    encoding?:
      | WritableEncodings
      | null
      | ((error: Error | null | undefined) => void),
    cb?: ((error: Error | null | undefined) => void),
  ): boolean {
    if (!this.writableEnded) {
      return Duplex.prototype.write.call(
        this,
        chunk,
        encoding as WritableEncodings | null,
        cb,
      );
    }

    if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
    }

    const err = new NodeError(
      "EPIPE",
      "This socket has been ended by the other party",
    );

    if (typeof cb === "function") {
      defaultTriggerAsyncIdScope(
        this[asyncIdSymbol],
        nextTick,
        cb,
        err,
      );
    }

    this.destroy(err);

    return false;
  }

  // Called when the 'end' event is emitted.
  #onReadableStreamEnd() {
    if (!this.allowHalfOpen) {
      this.write = this.#writeAfterFIN;
    }
  }

  // Called when creating new Socket, or when re-using a closed Socket
  #initSocketHandle() {
    this._undestroy();
    this._sockname = null;

    // Handle creation may be deferred to bind() or connect() time.
    if (this._handle) {
      this._handle[ownerSymbol] = this;
      this._handle.onread = onStreamRead;
      this[asyncIdSymbol] = getNewAsyncId(this._handle);

      let userBuf = this[kBuffer];

      if (userBuf) {
        const bufGen = this[kBufferGen];

        if (bufGen !== null) {
          userBuf = bufGen();

          if (!isUint8Array(userBuf)) {
            return;
          }

          this[kBuffer] = userBuf;
        }

        this._handle.useUserBuffer(userBuf);
      }
    }
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
  [asyncIdSymbol] = -1;
  _handle = null;
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
  }

  _listen2() {
    // TODO(cmorten)
    notImplemented();
  }

  listen(..._args: unknown[]) {
    // TODO(cmorten)
    notImplemented();
  }

  address() {
    // TODO(cmorten)
    notImplemented();
  }

  getConnections(_cb: (err: Error | null, connections: number) => void) {
    // TODO(cmorten)
    notImplemented();
  }

  close(_cb?: (err?: Error) => void) {
    // TODO(cmorten)
    notImplemented();
  }

  _emitClosedIfDrained() {
    // TODO(cmorten)
    notImplemented();
  }

  _setupWorker(_socketList: EventEmitter) {
    // TODO(cmorten)
    notImplemented();
  }

  ref() {
    // TODO(cmorten)
    notImplemented();
  }

  unref() {
    // TODO(cmorten)
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
 * import type { Socket } from "https://deno.land/std@$STD_VERSION/node/net.ts";
 *
 * const require = createRequire(import.meta.url);
 * const net = require("net");
 *
 * const server = net.createServer((c: Socket) => {
 *   // "connection" listener.
 *   console.log("client connected");
 *   c.on("end", () => {
 *     console.log("client disconnected");
 *   });
 *   c.write("hello\r\n");
 *   c.pipe(c);
 * });
 *
 * server.on("error", (err: Error) => {
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

export { isIP, isIPv4, isIPv6 };

export default {
  isIP,
  isIPv4,
  isIPv6,
  createServer,
  Server,
  Socket,
  Stream,
};
