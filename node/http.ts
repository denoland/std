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
            this.respond();
          }
        }
        controller.enqueue(chunkToU8(chunk));
        return cb();
      },
      final: (cb) => {
        if (this.#firstChunk) {
          this.respond(this.#firstChunk);
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

  writeHead(status: number, headers: Headers) {
    this.statusCode = status;
    for (const [k, v] of headers.entries()) {
      this.#headers.set(k, v);
    }
    return this;
  }

  #ensureHeaders(singleChunk?: Chunk) {
    if (this.statusCode == null) {
      this.statusCode = 200;
      this.statusMessage = "OK";
      this.#headers = new Headers(
        typeof singleChunk === "string" ? { "content-type": "text/plain" } : {},
      );
    }
  }

  respond(singleChunk?: Chunk) {
    this.headersSent = true;
    this.#ensureHeaders(singleChunk);
    const body = singleChunk ?? this.readable;
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

  get url() {
    // TODO: consider more robust path extraction, e.g:
    // url: (new URL(request.url).pathname),
    return this.req.url.slice(this.req.url.indexOf("/", 8));
  }
}

type ServerHandler = (req: IncomingMessage, res: ServerResponse) => void;

export class Server extends EventEmitter {
  handler: ServerHandler;
  #listener?: Deno.Listener;
  listening = false;

  constructor(handler: ServerHandler) {
    super();
    this.handler = handler;
  }

  async listen(port: number) {
    this.#listener = Deno.listen({ port });
    this.listening = true;
    for await (const conn of this.#listener) {
      for await (const reqEvent of Deno.serveHttp(conn)) {
        const req = new IncomingMessage(reqEvent.request);
        const res = new ServerResponse(reqEvent);
        this.emit("request", req, res);
        this.handler(req, res);
      }
    }
  }
  close() {
    this.#listener!.close();
    this.emit("close");
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
