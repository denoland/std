// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import * as DenoUnstable from "../_deno_unstable.ts";
import { Deferred, deferred } from "../async/deferred.ts";
import { core } from "./_core.ts";
import { _normalizeArgs, ListenOptions, Socket } from "./net.ts";
import { Buffer } from "./buffer.ts";
import { ERR_SERVER_NOT_RUNNING } from "./internal/errors.ts";
import { EventEmitter } from "./events.ts";
import { nextTick } from "./_next_tick.ts";
import { Status as STATUS_CODES } from "../http/http_status.ts";
import { validatePort } from "./internal/validators.mjs";
import {
  Readable as NodeReadable,
  Writable as NodeWritable,
} from "./stream.ts";
import { OutgoingMessage } from "./_http_outgoing.ts";
import { Agent } from "./_http_agent.mjs";
import { urlToHttpOptions } from "./internal/url.ts";
import { constants, TCP } from "./internal_binding/tcp_wrap.ts";

const { core } = Deno;
const { ops } = core;

const METHODS = [
  "ACL",
  "BIND",
  "CHECKOUT",
  "CONNECT",
  "COPY",
  "DELETE",
  "GET",
  "HEAD",
  "LINK",
  "LOCK",
  "M-SEARCH",
  "MERGE",
  "MKACTIVITY",
  "MKCALENDAR",
  "MKCOL",
  "MOVE",
  "NOTIFY",
  "OPTIONS",
  "PATCH",
  "POST",
  "PROPFIND",
  "PROPPATCH",
  "PURGE",
  "PUT",
  "REBIND",
  "REPORT",
  "SEARCH",
  "SOURCE",
  "SUBSCRIBE",
  "TRACE",
  "UNBIND",
  "UNLINK",
  "UNLOCK",
  "UNSUBSCRIBE",
];

type Chunk = string | Buffer | Uint8Array;

function chunkToU8(chunk: Chunk): Uint8Array {
  if (typeof chunk === "string") {
    return core.encode(chunk);
  }
  return chunk;
}

export interface RequestOptions {
  agent?: Agent;
  auth?: string;
  createConnection?: () => unknown;
  defaultPort?: number;
  family?: number;
  headers?: Record<string, string>;
  hints?: number;
  host?: string;
  hostname?: string;
  insecureHTTPParser?: boolean;
  localAddress?: string;
  localPort?: number;
  lookup?: () => void;
  maxHeaderSize?: number;
  method?: string;
  path?: string;
  port?: number;
  protocol?: string;
  setHost?: boolean;
  socketPath?: string;
  timeout?: number;
  signal?: AbortSignal;
  href?: string;
}

/** ClientRequest represents the http(s) request from the client */
class ClientRequest extends NodeWritable {
  defaultProtocol = "http:";
  body: null | ReadableStream = null;
  controller: ReadableStreamDefaultController | null = null;
  constructor(
    public opts: RequestOptions,
    public cb?: (res: IncomingMessageForClient) => void,
  ) {
    super();
  }

  // deno-lint-ignore no-explicit-any
  override _write(chunk: any, _enc: string, cb: () => void) {
    if (this.controller) {
      this.controller.enqueue(chunk);
      cb();
      return;
    }

    this.body = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
        controller.enqueue(chunk);
        cb();
      },
    });
  }

  override async _final() {
    if (this.controller) {
      this.controller.close();
    }

    const client = await this._createCustomClient();
    const opts = { body: this.body, method: this.opts.method, client };
    const mayResponse = fetch(this._createUrlStrFromOptions(this.opts), opts)
      .catch((e) => {
        if (e.message.includes("connection closed before message completed")) {
          // Node.js seems ignoring this error
        } else {
          this.emit("error", e);
        }
        return undefined;
      });
    const res = new IncomingMessageForClient(
      await mayResponse,
      this._createSocket(),
    );
    this.emit("response", res);
    if (client) {
      res.on("end", () => {
        client.close();
      });
    }
    this.cb?.(res);
  }

  abort() {
    this.destroy();
  }

  _createCustomClient(): Promise<DenoUnstable.HttpClient | undefined> {
    return Promise.resolve(undefined);
  }

  _createSocket(): Socket {
    // Note: Creates a dummy socket for the compatibility
    // Sometimes the libraries check some properties of socket
    // e.g. if (!response.socket.authorized) { ... }
    return new Socket({});
  }

  // deno-lint-ignore no-explicit-any
  _createUrlStrFromOptions(opts: any) {
    if (opts.href) {
      return opts.href;
    } else {
      const {
        auth,
        protocol,
        host,
        hostname,
        path,
        port,
      } = opts;
      return `${protocol ?? this.defaultProtocol}//${auth ? `${auth}@` : ""}${
        host ?? hostname
      }${port ? `:${port}` : ""}${path || ""}`;
    }
  }
}

// Construct an HTTP response message.
// All HTTP/1.1 messages consist of a start-line followed by a sequence
// of octets.
//
//  HTTP-message = start-line
//    *( header-field CRLF )
//    CRLF
//    [ message-body ]
//
function http1Response(method, status, headerList, body, earlyEnd = false) {
  // HTTP uses a "<major>.<minor>" numbering scheme
  //   HTTP-version  = HTTP-name "/" DIGIT "." DIGIT
  //   HTTP-name     = %x48.54.54.50 ; "HTTP", case-sensitive
  //
  // status-line = HTTP-version SP status-code SP reason-phrase CRLF
  // Date header: https://datatracker.ietf.org/doc/html/rfc7231#section-7.1.1.2
  let str = `HTTP/1.1 ${status} ${statusCodes[status]}\r\nDate: ${date}\r\n`;
  for (const [name, value] of headerList) {
    // header-field   = field-name ":" OWS field-value OWS
    str += `${name}: ${value}\r\n`;
  }

  // https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.6
  if (status === 205 || status === 304) {
    // MUST NOT generate a payload in a 205 response.
    // indicate a zero-length body for the response by
    // including a Content-Length header field with a value of 0.
    str += "Content-Length: 0\r\n";
    return str;
  }

  // MUST NOT send Content-Length or Transfer-Encoding if status code is 1xx or 204.
  if (status == 204 && status <= 100) {
    return str;
  }

  if (earlyEnd === true) {
    return str;
  }

  // null body status is validated by inititalizeAResponse in ext/fetch
  if (body !== null && body !== undefined) {
    str += `Content-Length: ${body.length}\r\n\r\n`;
  } else {
    str += "Transfer-Encoding: chunked\r\n\r\n";
    return str;
  }

  // A HEAD request.
  if (method === 1) return str;

  if (typeof body === "string") {
    str += body ?? "";
  } else {
    const head = core.encode(str);
    const response = new Uint8Array(head.byteLength + body.byteLength);
    response.set(head, 0);
    response.set(body, head.byteLength);
    return response;
  }

  return str;
}

/** IncomingMessage for http(s) client */
export class IncomingMessageForClient extends NodeReadable {
  reader: ReadableStreamDefaultReader | undefined;
  constructor(public response: Response | undefined, public socket: Socket) {
    super();
    this.reader = response?.body?.getReader();
  }

  override async _read(_size: number) {
    if (this.reader === undefined) {
      this.push(null);
      return;
    }
    try {
      const res = await this.reader.read();
      if (res.done) {
        this.push(null);
        return;
      }
      this.push(res.value);
    } catch (e) {
      // deno-lint-ignore no-explicit-any
      this.destroy(e as any);
    }
  }

  get headers() {
    if (this.response) {
      return Object.fromEntries(this.response.headers.entries());
    }
    return {};
  }

  get trailers() {
    return {};
  }

  get statusCode() {
    return this.response?.status || 0;
  }

  get statusMessage() {
    return this.response?.statusText || "";
  }
}

const statusCodes = {
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  226: "IM Used",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  418: "I'm a teapot",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required",
};
let dateInterval;
let date;
export class ServerResponse extends NodeWritable {
  statusCode?: number = undefined;
  statusMessage?: string = undefined;
  #headers = new Headers({});
  #readable: ReadableStream;
  headersSent = false;
  #req: number;
  #fastOps: any;
  #firstChunk: Chunk | null = null;

  constructor(req: number, fastOps: any) {
    let controller: ReadableByteStreamController;
    const readable = new ReadableStream({
      start(c) {
        controller = c as ReadableByteStreamController;
      },
    });
    super({
      autoDestroy: true,
      defaultEncoding: "utf-8",
      emitClose: true,
      write: (chunk, _encoding, cb) => {
        if (!this.headersSent) {
          if (this.#firstChunk === null) {
            this.#firstChunk = chunk;
            return cb();
          } else {
            controller.enqueue(chunkToU8(this.#firstChunk));
            this.#firstChunk = null;
            this.respond(false);
          }
        }
        controller.enqueue(chunkToU8(chunk));
        return cb();
      },
      final: (cb) => {
        if (this.#firstChunk) {
          this.respond(true, this.#firstChunk);
        } else if (!this.headersSent) {
          this.respond(true);
        }
        controller.close();
        return cb();
      },
      destroy: (err, cb) => {
        if (err) {
          controller.error(err);
        }
        return cb(null);
      },
    });
    this.#readable = readable;
    this.#req = req;
    this.#fastOps = fastOps;
  }

  setHeader(name: string, value: string) {
    this.#headers.set(name, value);
    return this;
  }

  getHeader(name: string) {
    return this.#headers.get(name);
  }
  removeHeader(name: string) {
    return this.#headers.delete(name);
  }
  getHeaderNames() {
    return Array.from(this.#headers.keys());
  }
  hasHeader(name: string) {
    return this.#headers.has(name);
  }

  writeHead(status: number, headers: Record<string, string>) {
    this.statusCode = status;
    for (const k in headers) {
      this.#headers.set(k, headers[k]);
    }
    return this;
  }

  #ensureHeaders(singleChunk?: Chunk) {
    if (this.statusCode === undefined) {
      this.statusCode = 200;
      this.statusMessage = "OK";
    }
    if (typeof singleChunk === "string" && !this.hasHeader("content-type")) {
      this.setHeader("content-type", "text/plain;charset=UTF-8");
    }
  }

  respond(final: boolean, singleChunk?: Chunk) {
    this.headersSent = true;
    this.#ensureHeaders(singleChunk);
    const body = singleChunk ?? (final ? null : this.#readable);

    if (singleChunk) {
      const responseStr = http1Response(
        0,
        this.statusCode ?? 200,
        this.#headers,
        singleChunk,
      );

      // TypedArray
      if (typeof responseStr !== "string") {
        this.#fastOps.respond(this.#req, responseStr, true);
      } else {
        // string
        ops.op_flash_respond(
          0,
          this.#req,
          responseStr,
          null,
          true,
        );
      }
      return;
    } else if (final) {
      throw new Error("todo"); 
    } else {
      throw new Error("todo");
    }
    // this.#promise.resolve(
    //   new Response(body, {
    //     headers: this.#headers,
    //     status: this.statusCode,
    //     statusText: this.statusMessage,
    //   }),
    // );
  }

  // deno-lint-ignore no-explicit-any
  override end(chunk?: any, encoding?: any, cb?: any): this {
    if (!chunk && this.#headers.has("transfer-encoding")) {
      // FIXME(bnoordhuis) Node sends a zero length chunked body instead, i.e.,
      // the trailing "0\r\n", but respondWith() just hangs when I try that.
      this.#headers.set("content-length", "0");
      this.#headers.delete("transfer-encoding");
    }

    // @ts-expect-error The signature for cb is stricter than the one implemented here
    return super.end(chunk, encoding, cb);
  }
}

const methods = {
  0: "GET",
  1: "HEAD",
  2: "CONNECT",
  3: "PUT",
  4: "DELETE",
  5: "OPTIONS",
  6: "TRACE",
  7: "POST",
  8: "PATCH",
};

export class IncomingMessageForServer extends NodeReadable {
  #req: number;
  #fastOps: any;
  #method: number;

  constructor(req: number, fastOps: any) {
    const method = fastOps.getMethod(req);
    
    // Check if no body (GET/HEAD/OPTIONS/...)
    let hasBody = method > 2; // Not GET/HEAD/CONNECT
    let reader = null;
    if (hasBody) {
      // The first packet is left over bytes after parsing the request
      const firstRead = core.ops.op_flash_first_packet(
        0,
        req,
      );
      if (firstRead) {
        let firstEnqueued = firstRead.byteLength == 0;
        reader = new ReadableStream({
          type: "bytes",
          async pull(controller) {
            try {
              if (firstEnqueued === false) {
                controller.enqueue(firstRead);
                firstEnqueued = true;
                return;
              }
              // This is the largest possible size for a single packet on a TLS
              // stream.
              const chunk = new Uint8Array(16 * 1024 + 256);
              const read = await core.opAsync(
                "op_flash_read_body",
                0,
                req,
                chunk,
              );
              if (read > 0) {
                // We read some data. Enqueue it onto the stream.
                controller.enqueue(chunk.subarray(0, read));
              } else {
                // We have reached the end of the body, so we close the stream.
                controller.close();
              }
            } catch (err) {
              // There was an error while reading a chunk of the body, so we
              // error.
              controller.error(err);
              controller.close();
            }
          },
        });
      }
    }

    super({
      autoDestroy: true,
      emitClose: true,
      objectMode: false,
      read: async function (_size) {
        if (!reader) {
          return this.push(null);
        }

        try {
          const { value } = await reader!.read();
          this.push(value !== undefined ? Buffer.from(value) : null);
        } catch (err) {
          this.destroy(err as Error);
        }
      },
      destroy: (err, cb) => {
        reader?.cancel().finally(() => cb(err));
      },
    });
    this.#method = method;
    this.#req = req;
    this.#fastOps = fastOps;
  }

  get url() {
    return ops.op_flash_path(0, this.#req);
  }

  get aborted() {
    return false;
  }
  get httpVersion() {
    return "1.1";
  }

  get headers() {
    return Object.fromEntries(ops.op_flash_headers(0, this.#req));
  }

  get method() {
    return methods[this.#method];
  }
}

type ServerHandler = (
  req: IncomingMessageForServer,
  res: ServerResponse,
) => void;

export function Server(handler?: ServerHandler): ServerImpl {
  return new ServerImpl(handler);
}

class ServerImpl extends EventEmitter {
  #addr?: Deno.NetAddr;
  #hasClosed = false;
  #ac?: AbortController;

  constructor(handler?: ServerHandler) {
    super();

    if (handler !== undefined) {
      this.on("request", handler);
    }
  }

  listen(...args: unknown[]): this {
    // TODO(bnoordhuis) Delegate to net.Server#listen().
    const normalized = _normalizeArgs(args);
    const options = normalized[0] as Partial<ListenOptions>;
    const cb = normalized[1];

    if (cb !== null) {
      // @ts-ignore change EventEmitter's sig to use CallableFunction
      this.once("listening", cb);
    }

    let port = 0;
    if (typeof options.port === "number" || typeof options.port === "string") {
      validatePort(options.port, "options.port");
      port = options.port | 0;
    }

    // TODO(bnoordhuis) Node prefers [::] when host is omitted,
    // we on the other hand default to 0.0.0.0.
    const hostname = options.host ?? "";

    this.#addr = {
      hostname,
      port,
    } as Deno.NetAddr;
    nextTick(() => this.#serve());

    return this;
  }

  async #serve() {
    this.emit("listening");

    if (this.#hasClosed) {
      return;
    }

    const ac = new AbortController();
    this.#ac = ac;

    const serverId = ops.op_flash_serve({ hostname: "127.0.0.1", port: this.#addr.port });
    const serverPromise = core.opAsync("op_flash_drive_server", serverId);

    const fastOps = ops.op_flash_make_request();
    function nextRequest() {
      return fastOps.nextRequest();
    }
    if (!dateInterval) {
      date = new Date().toUTCString();
      dateInterval = setInterval(() => {
        date = new Date().toUTCString();
      }, 1000);
    }
    let offset = 0;
    while(true) {
      let token = nextRequest();
      if (token === 0) token = await core.opAsync("op_flash_next_async", serverId);

      for (let i = offset; i < offset + token; i++) {
        (async () => {
          const req = new IncomingMessageForServer(i, fastOps);
          const res = new ServerResponse(i, fastOps);  
          this.emit("request", req, res);
        })().catch(console.log);
      }
      offset += token;
    }

    await serverPromise;
  }

  get listening() {
    return !this.#hasClosed;
  }

  close(cb?: (err?: Error) => void): this {
    const listening = this.listening;

    this.#hasClosed = true;
    if (typeof cb === "function") {
      if (listening) {
        this.once("close", cb);
      } else {
        this.once("close", function close() {
          cb(new ERR_SERVER_NOT_RUNNING());
        });
      }
    }

    nextTick(() => this.emit("close"));

    if (listening) {
      this.#ac?.abort();
      this.#ac = undefined;
    }

    return this;
  }

  address() {
    const addr = this.#addr!;
    return {
      port: addr.port,
      address: addr.hostname,
    };
  }
}

Server.prototype = ServerImpl.prototype;

export function createServer(handler?: ServerHandler) {
  return Server(handler);
}

/** Makes an HTTP request. */
export function request(
  url: string | URL,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
export function request(
  opts: RequestOptions,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
export function request(
  url: string | URL,
  opts: RequestOptions,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
// deno-lint-ignore no-explicit-any
export function request(...args: any[]) {
  let options = {};
  if (typeof args[0] === "string") {
    options = urlToHttpOptions(new URL(args.shift()));
  } else if (args[0] instanceof URL) {
    options = urlToHttpOptions(args.shift());
  }
  if (args[0] && typeof args[0] !== "function") {
    Object.assign(options, args.shift());
  }
  args.unshift(options);
  return new ClientRequest(args[0], args[1]);
}

/** Makes a `GET` HTTP request. */
export function get(
  url: string | URL,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
export function get(
  opts: RequestOptions,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
export function get(
  url: string | URL,
  opts: RequestOptions,
  cb?: (res: IncomingMessageForClient) => void,
): ClientRequest;
// deno-lint-ignore no-explicit-any
export function get(...args: any[]) {
  const req = request(args[0], args[1], args[2]);
  req.end();
  return req;
}

export {
  Agent,
  ClientRequest,
  IncomingMessageForServer as IncomingMessage,
  METHODS,
  OutgoingMessage,
  STATUS_CODES,
};
export default {
  Agent,
  ClientRequest,
  STATUS_CODES,
  METHODS,
  createServer,
  Server,
  IncomingMessage: IncomingMessageForServer,
  IncomingMessageForClient,
  IncomingMessageForServer,
  OutgoingMessage,
  ServerResponse,
  request,
  get,
};
