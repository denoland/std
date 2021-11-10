import { Status as STATUS_CODES } from "../http/http_status.ts";
import { Buffer } from "./buffer.ts";
import { EventEmitter } from "./events.ts";
import NodeReadable from "./_stream/readable.ts";
import NodeWritable from "./_stream/writable.ts";

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
    // @ts-ignore using core isn't a best practice but hey ...
    return Deno.core.encode(chunk);
  }
  return chunk;
}

export class ServerResponse extends NodeWritable {
  statusCode?: number = undefined;
  statusMessage?: string = undefined;
  #headers = new Headers({});
  private readable: ReadableStream;
  headersSent = false;
  #reqEvent: Deno.RequestEvent;
  #firstChunk: Chunk | null = null;

  constructor(reqEvent: Deno.RequestEvent) {
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
    this.readable = readable;
    this.#reqEvent = reqEvent;
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
    const body = singleChunk ?? (final ? null : this.readable);
    this.#reqEvent.respondWith(
      new Response(body, {
        headers: this.#headers,
        status: this.statusCode,
        statusText: this.statusMessage,
      }),
    );
  }
}

// TODO(@AaronO): optimize
export class IncomingMessage extends NodeReadable {
  private req: Request;
  url: string;

  constructor(req: Request) {
    // Check if no body (GET/HEAD/OPTIONS/...)
    const reader = req.body?.getReader();
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
    this.req = req;
    // TODO: consider more robust path extraction, e.g:
    // url: (new URL(request.url).pathname),
    this.url = req.url.slice(this.req.url.indexOf("/", 8));
  }

  get aborted() {
    return false;
  }
  get httpVersion() {
    return "1.1";
  }

  get headers() {
    return Object.fromEntries(this.req.headers.entries());
  }
  get method() {
    return this.req.method;
  }
}

type ServerHandler = (req: IncomingMessage, res: ServerResponse) => void;

export class Server extends EventEmitter {
  #handler: ServerHandler;
  #listener?: Deno.Listener;
  #listening = false;

  constructor(handler: ServerHandler) {
    super();
    this.#handler = handler;
  }

  // TODO(AaronO): support options object
  listen(port: number, host?: string, cb?: CallableFunction) {
    this.#listener = Deno.listen({ port, hostname: host });
    this.#listening = true;
    // TODO(@AaronO):
    // @ts-ignore change EventEmitter's sig to use CallabeFunction
    this.once("listening", cb ?? (() => {}));
    this.#listenLoop();
    this.emit("listening");
  }

  async #listenLoop() {
    for await (const conn of this.#listener!) {
      (async () => {
        for await (const reqEvent of Deno.serveHttp(conn)) {
          const req = new IncomingMessage(reqEvent.request);
          const res = new ServerResponse(reqEvent);
          this.emit("request", req, res);
          this.#handler(req, res);
        }
      })();
    }
  }

  get listening() {
    return this.#listening;
  }

  close() {
    this.#listening = false;
    this.#listener!.close();
    this.emit("close");
  }

  address() {
    const addr = this.#listener!.addr as Deno.NetAddr;
    return {
      port: addr.port,
      address: addr.hostname,
    };
  }
}

export function createServer(handler: ServerHandler) {
  return new Server(handler);
}

export { METHODS, STATUS_CODES };
export default {
  STATUS_CODES,
  METHODS,
  createServer,
  Server,
  IncomingMessage,
  ServerResponse,
};
