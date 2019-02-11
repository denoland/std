// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { Conn, copy, listen, Reader, toAsyncIterator, Writer } from "deno";
import { BufReader, BufWriter } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";
import { STATUS_TEXT } from "./http_status.ts";
import { assert } from "../testing/mod.ts";
import { Deferred } from "../async/deferred.ts";
import { pathToRegexp } from "./path_to_regexp.ts";
import { BodyReader, ChunkedBodyReader } from "./readers.ts";

export type HttpHandler = (req: ServerRequest) => Promise<any>;

export type ServerRequest = {
  url: string;
  method: string;
  proto: string;
  headers: Headers;
  body: Reader;
  respond: ServerResponder;
};

export type ServerResponder = (response: ServerResponse) => Promise<any>;

export interface ServerResponse {
  status?: number;
  headers?: Headers;
  body?: Uint8Array | Reader;
}

export async function* serve(
  addr: string
): AsyncIterableIterator<ServerRequest> {
  const listener = listen("tcp", addr);
  while (true) {
    let conn: Conn;
    yield listener.accept().then(async c => {
      conn = c;
      return readRequest(conn, async response => {
        await writeResponse(conn, response);
      });
    });
  }
}

export async function listenAndServe(addr: string, handler: HttpHandler) {
  const server = serve(addr);

  for await (const req of server) {
    await handler(req);
  }
}

export interface HttpServer {
  handle(pattern: string, handler: HttpHandler);

  listen(addr): Deferred;
}

export function createServer(): HttpServer {
  return new HttpServerImpl();
}

class HttpServerImpl implements HttpServer {
  private handlers: {
    [key: string]: {
      pattern: string;
      regexp: RegExp;
      handler: HttpHandler;
    };
  } = Object.create(null);

  handle(pattern: string, handler: HttpHandler) {
    this.handlers[pattern] = {
      pattern,
      regexp: pathToRegexp(pattern),
      handler
    };
  }

  listen(addr: string): Deferred<void> {
    const listener = listen("tcp", addr);
    // Loop hack to allow yield (yield won't work in callbacks)
    let resolve = () => {};
    let reject = () => {};
    const promise = new Promise<void>(async (res, rej) => {
      resolve = res;
      reject = rej;
      try {
        for await (const req of serve(addr)) {
          for (const [_, val] of Object.entries(this.handlers)) {
            const { regexp, handler } = val;
            if (req.url.match(regexp)) {
              await handler(req);
              break;
            }
          }
        }
      } finally {
        listener.close();
      }
    });
    return { promise, reject, resolve };
  }
}

export function setContentLength(r: ServerResponse): void {
  if (!r.headers) {
    r.headers = new Headers();
  }

  if (r.body) {
    if (!r.headers.has("content-length")) {
      if (r.body instanceof Uint8Array) {
        const bodyLength = r.body.byteLength;
        r.headers.append("Content-Length", bodyLength.toString());
      } else {
        r.headers.append("Transfer-Encoding", "chunked");
      }
    }
  }
}

class ServerRequestInternal {
  constructor(public req: ServerRequest, public conn: Conn) {}
}

function isServerRequest(x): x is ServerRequest {
  return (
    typeof x === "object" &&
    x.hasOwnProperty("url") &&
    x.hasOwnProperty("method") &&
    x.hasOwnProperty("proto")
  );
}

function bufWriter(w: Writer): BufWriter {
  if (w instanceof BufWriter) {
    return w;
  } else {
    return new BufWriter(w);
  }
}

export async function writeResponse(
  w: Writer,
  r: ServerResponse
): Promise<void> {
  const protoMajor = 1;
  const protoMinor = 1;
  const statusCode = r.status || 200;
  const statusText = STATUS_TEXT.get(statusCode);
  const writer = bufWriter(w);
  if (!statusText) {
    throw Error("bad status code");
  }

  let out = `HTTP/${protoMajor}.${protoMinor} ${statusCode} ${statusText}\r\n`;

  setContentLength(r);

  if (r.headers) {
    for (const [key, value] of r.headers) {
      out += `${key}: ${value}\r\n`;
    }
  }
  out += "\r\n";

  const header = new TextEncoder().encode(out);
  let n = await writer.write(header);
  assert(header.byteLength == n);

  if (r.body) {
    if (r.body instanceof Uint8Array) {
      n = await writer.write(r.body);
      assert(r.body.byteLength == n);
    } else {
      if (r.headers.has("content-length")) {
        const bodyLength = parseInt(r.headers.get("content-length"));
        const n = await copy(writer, r.body);
        assert(n == bodyLength);
      } else {
        await writeChunkedBody(writer, r.body);
      }
    }
  }
  await writer.flush();
}

async function writeChunkedBody(w: Writer, r: Reader) {
  const writer = bufWriter(w);
  const encoder = new TextEncoder();

  for await (const chunk of toAsyncIterator(r)) {
    const start = encoder.encode(`${chunk.byteLength.toString(16)}\r\n`);
    const end = encoder.encode("\r\n");
    await writer.write(start);
    await writer.write(chunk);
    await writer.write(end);
  }

  const endChunk = encoder.encode("0\r\n\r\n");
  await writer.write(endChunk);
}

export async function readRequest(
  conn: Reader,
  respond: ServerResponder
): Promise<ServerRequest> {
  const bufr = new BufReader(conn);
  const tp = new TextProtoReader(bufr!);

  // First line: GET /index.html HTTP/1.0
  const [line, lineErr] = await tp.readLine();
  if (lineErr) {
    throw lineErr;
  }
  const [method, url, proto] = line.split(" ", 3);
  const [headers, headersErr] = await tp.readMIMEHeader();
  if (headersErr) {
    throw headersErr;
  }
  const contentLength = headers.get("content-length");
  const body =
    headers.get("transfer-encoding") === "chunked"
      ? new ChunkedBodyReader(bufr)
      : new BodyReader(bufr, parseInt(contentLength));
  return { method, url, proto, headers, body, respond };
}
