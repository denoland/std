import { Status as STATUS_CODES } from "../http/http_status.ts";

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

import { Buffer } from "./buffer.ts";
type Chunk = string | Buffer | Uint8Array;
type Headers = Record<string, string>;

export class ServerResponse {
  status?: number;
  headers: Headers;
  chunks: Chunk[];
  headersSent: boolean;
  private reqEvent: Deno.RequestEvent;

  constructor(reqEvent: Deno.RequestEvent) {
    this.status = undefined;
    this.headers = {};
    this.chunks = [];
    this.headersSent = false;
    this.reqEvent = reqEvent;
  }

  setHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  getHeader(name: string) {
    return this.headers[name];
  }

  writeHead(status: number, headers: Headers) {
    this.status = status;
    Object.assign(this.headers, headers);
  }
  write(chunk: Chunk) {
    this._addChunk(chunk);
  }

  _addChunk(chunk: Chunk) {
    if (this.status === null) {
      this.status = 200;
      this.headers = { "content-type": "text/plain" };
    }
    this.chunks.push(chunk);
  }

  _body(lastChunk?: Chunk) {
    // TODO: incorrectly assumes all chunks are strings
    return this.chunks ? this.chunks.join("") + lastChunk : lastChunk;
  }

  end(lastChunk: Chunk) {
    const body = this._body(lastChunk);
    this.headersSent = true;
    this.reqEvent.respondWith(new Response(body, { headers: this.headers }));
  }
}

export class IncomingMessage {
  private req: Request;

  constructor(req: Request) {
    this.req = req;
  }

  get aborted() {
    return false;
  }
  get completed() {
    return true;
  }
  get httpVersion() {
    return "1.1";
  }

  get headers() {
    return this.req.headers;
  }

  get url() {
    // TODO: consider more robust path extraction, e.g:
    // url: (new URL(request.url).pathname),
    return this.req.url.slice(this.req.url.indexOf("/", 8));
  }
}

type ServerHandler = (req: IncomingMessage, res: ServerResponse) => void;

export class Server {
  handler: ServerHandler;

  constructor(handler: ServerHandler) {
    this.handler = handler;
  }

  async listen(port: number) {
    for await (const conn of Deno.listen({ port })) {
      (async () => {
        for await (const reqEvent of Deno.serveHttp(conn)) {
          this.handler(
            new IncomingMessage(reqEvent.request),
            new ServerResponse(reqEvent),
          );
        }
      })();
    }
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
