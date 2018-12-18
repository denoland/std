import { listen, Conn, toAsyncIterator, Reader, copy } from "deno";
import { BufReader, BufState, BufWriter } from "./bufio.ts";
import { TextProtoReader } from "./textproto.ts";
import { STATUS_TEXT } from "./http_status";
import { assert } from "./util";

interface Deferred {
  promise: Promise<{}>;
  resolve: () => void;
  reject: () => void;
}

function deferred(): Deferred {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject
  };
}

interface ServeEnv {
  reqQueue: ServerRequest[];
  serveDeferred: Deferred;
}

// Continuously read more requests from conn until EOF
// Mutually calling with maybeHandleReq
// TODO: make them async function after this change is done
// https://github.com/tc39/ecma262/pull/1250
// See https://v8.dev/blog/fast-async
function serveConn(env: ServeEnv, conn: Conn, bufr?: BufReader) {
  readRequest(conn, bufr).then(maybeHandleReq.bind(null, env, conn));
}
function maybeHandleReq(env: ServeEnv, conn: Conn, maybeReq: any) {
  const [req, _err] = maybeReq;
  if (_err) {
    conn.close(); // assume EOF for now...
    return;
  }
  env.reqQueue.push(req); // push req to queue
  env.serveDeferred.resolve(); // signal while loop to process it
}

export async function* serve(addr: string) {
  const listener = listen("tcp", addr);
  const env: ServeEnv = {
    reqQueue: [], // in case multiple promises are ready
    serveDeferred: deferred()
  };

  // Routine that keeps calling accept
  const acceptRoutine = () => {
    const handleConn = (conn: Conn) => {
      serveConn(env, conn); // don't block
      scheduleAccept(); // schedule next accept
    };
    const scheduleAccept = () => {
      listener.accept().then(handleConn);
    };
    scheduleAccept();
  };

  acceptRoutine();

  // Loop hack to allow yield (yield won't work in callbacks)
  while (true) {
    await env.serveDeferred.promise;
    env.serveDeferred = deferred(); // use a new deferred
    let queueToProcess = env.reqQueue;
    env.reqQueue = [];
    for (const result of queueToProcess) {
      yield result;
      // Continue read more from conn when user is done with the current req
      // Moving this here makes it easier to manage
      serveConn(env, result.conn, result.r);
    }
  }
  listener.close();
}

export async function listenAndServe(
  addr: string,
  handler: (req: ServerRequest) => void
) {
  const server = serve(addr);

  for await (const request of server) {
    await handler(request);
  }
}

export interface Response {
  status?: number;
  headers?: Headers;
  body?: Uint8Array | Reader;
}

export function setContentLength(r: Response): void {
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

export class ServerRequest {
  url: string;
  method: string;
  proto: string;
  headers: Headers;
  conn: Conn;
  r: BufReader;
  w: BufWriter;

  // TODO: implement stream request body
  public async *readChunk() {
    if (this.headers.has("content-length")) {
      const len = +this.headers.get("content-length");
      if (Number.isNaN(len)) {
        return new Uint8Array(0);
      }
      let buf = new Uint8Array(1024);
      let rr = await this.r.read(buf);
      let nread = rr.nread;
      while (!rr.eof && nread < len) {
        yield buf.subarray(0, rr.nread);
        buf = new Uint8Array(1024);
        rr = await this.r.read(buf);
        nread += rr.nread;
      }
      yield buf.subarray(0, rr.nread);
    } else if (this.headers.get("transfer-encoding") === "chunked") {
      // Based on https://tools.ietf.org/html/rfc2616#section-19.4.6
      let len = 0;
      const chunks = [];
      const tp = new TextProtoReader(this.r);
      let [line, _] = await tp.readLine();
      // TODO: handle chunk extension
      let [chunkSizeString, optExt] = line.split(";");
      let chunkSize = parseInt(chunkSizeString, 16);
      if (Number.isNaN(chunkSize) || chunkSize < 0) {
        throw new Error("Invalid chunk size");
      }
      while (chunkSize > 0) {
        let data = new Uint8Array(chunkSize);
        let [nread, err] = await this.r.readFull(data);
        if (nread !== chunkSize) {
          throw new Error("Chunk data does not match size");
        }
        yield data;
        len += chunkSize;
        await this.r.readLine(); // Consume \r\n
        [line, _] = await tp.readLine();
        chunkSize = parseInt(line, 16);
      }
      const [entityHeaders, err] = await tp.readMIMEHeader();
      if (!err) {
        for (let [k, v] of entityHeaders) {
          this.headers.set(k, v);
        }
      }
      /* Pseudo code from https://tools.ietf.org/html/rfc2616#section-19.4.6
      length := 0
      read chunk-size, chunk-extension (if any) and CRLF
      while (chunk-size > 0) {
        read chunk-data and CRLF
        append chunk-data to entity-body
        length := length + chunk-size
        read chunk-size and CRLF
      }
      read entity-header
      while (entity-header not empty) {
        append entity-header to existing header fields
        read entity-header
      }
      Content-Length := length
      Remove "chunked" from Transfer-Encoding
      */
    } else {
      yield new Uint8Array(0);
    }
  }

  // Read the body of the request into a single Uint8Array
  public async readAll(): Promise<Uint8Array> {
    if (this.headers.has("content-length")) {
      const len = +this.headers.get("content-length");
      if (Number.isNaN(len)) {
        return new Uint8Array(0);
      }
      const body = new Uint8Array(len);
      let rr = await this.r.read(body);
      let nread = rr.nread;
      while (!rr.eof && nread < len) {
        rr = await this.r.read(body.subarray(nread));
        nread += rr.nread;
      }
      return body;
    } else if (this.headers.get("transfer-encoding") === "chunked") {
      // Based on https://tools.ietf.org/html/rfc2616#section-19.4.6
      let len = 0;
      const chunks = [];
      const tp = new TextProtoReader(this.r);
      let [line, _] = await tp.readLine();
      // TODO: handle chunk extension
      let [chunkSizeString, optExt] = line.split(";");
      let chunkSize = parseInt(chunkSizeString, 16);
      if (Number.isNaN(chunkSize) || chunkSize < 0) {
        throw new Error("Invalid chunk size");
      }
      while (chunkSize > 0) {
        let data = new Uint8Array(chunkSize);
        let [nread, err] = await this.r.readFull(data);
        if (nread !== chunkSize) {
          throw new Error("Chunk data does not match size");
        }
        chunks.push(data);
        len += chunkSize;
        await this.r.readLine(); // Consume \r\n
        [line, _] = await tp.readLine();
        chunkSize = parseInt(line, 16);
      }
      const [entityHeaders, err] = await tp.readMIMEHeader();
      if (!err) {
        for (let [k, v] of entityHeaders) {
          this.headers.set(k, v);
        }
      }
      // TODO: should we set content-length?
      const body = new Uint8Array(len);
      let offset = 0;
      for (let chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.length;
      }
      return body;
      /* Pseudo code from https://tools.ietf.org/html/rfc2616#section-19.4.6
      length := 0
      read chunk-size, chunk-extension (if any) and CRLF
      while (chunk-size > 0) {
        read chunk-data and CRLF
        append chunk-data to entity-body
        length := length + chunk-size
        read chunk-size and CRLF
      }
      read entity-header
      while (entity-header not empty) {
        append entity-header to existing header fields
        read entity-header
      }
      Content-Length := length
      Remove "chunked" from Transfer-Encoding
      */
    } else {
      return new Uint8Array(0);
    }
  }

  private async _streamBody(body: Reader, bodyLength: number) {
    const n = await copy(this.w, body);
    assert(n == bodyLength);
  }

  private async _streamChunkedBody(body: Reader) {
    const encoder = new TextEncoder();

    for await (const chunk of toAsyncIterator(body)) {
      const start = encoder.encode(`${chunk.byteLength.toString(16)}\r\n`);
      const end = encoder.encode("\r\n");
      await this.w.write(start);
      await this.w.write(chunk);
      await this.w.write(end);
    }

    const endChunk = encoder.encode("0\r\n\r\n");
    await this.w.write(endChunk);
  }

  async respond(r: Response): Promise<void> {
    const protoMajor = 1;
    const protoMinor = 1;
    const statusCode = r.status || 200;
    const statusText = STATUS_TEXT.get(statusCode);
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
    let n = await this.w.write(header);
    assert(header.byteLength == n);

    if (r.body) {
      if (r.body instanceof Uint8Array) {
        n = await this.w.write(r.body);
        assert(r.body.byteLength == n);
      } else {
        if (r.headers.has("content-length")) {
          await this._streamBody(
            r.body,
            parseInt(r.headers.get("content-length"))
          );
        } else {
          await this._streamChunkedBody(r.body);
        }
      }
    }

    await this.w.flush();
  }
}

async function readRequest(
  c: Conn,
  bufr?: BufReader
): Promise<[ServerRequest, BufState]> {
  if (!bufr) {
    bufr = new BufReader(c);
  }
  const bufw = new BufWriter(c);
  const req = new ServerRequest();
  req.conn = c;
  req.r = bufr!;
  req.w = bufw;
  const tp = new TextProtoReader(bufr!);

  let s: string;
  let err: BufState;

  // First line: GET /index.html HTTP/1.0
  [s, err] = await tp.readLine();
  if (err) {
    return [null, err];
  }
  [req.method, req.url, req.proto] = s.split(" ", 3);

  [req.headers, err] = await tp.readMIMEHeader();

  return [req, err];
}

async function collect(
  it: AsyncIterableIterator<Uint8Array>
): Promise<Uint8Array> {
  const chunks = [];
  let len = 0;
  for await (const chunk of it) {
    chunks.push(chunk);
    len += chunk.length;
  }
  const collected = new Uint8Array(len);
  let offset = 0;
  for (let chunk of chunks) {
    collected.set(chunk, offset);
    offset += chunk.length;
  }
  return collected;
}
