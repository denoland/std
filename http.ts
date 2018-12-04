import { listen, Conn } from "deno";
import { BufReader, BufState, BufWriter } from "./bufio.ts";
import { TextProtoReader } from "./textproto.ts";
import { STATUS_TEXT } from "./http_status";
import { assert } from "./util";

export async function* serve(addr: string) {
  const listener = listen("tcp", addr);
  // For racing promises
  const pool: Promise<any>[] = [];
  const untrackFromPool = (p: Promise<any>) => {
    const requestIndex = pool.indexOf(p);
    if (requestIndex >= 0) {
      pool.splice(requestIndex, 1);
    }
  };
  // Push conn promise also to pool to avoid starving
  let trackedConnPromise = listener.accept().then(conn => [
    conn,
    untrackFromPool.bind(null, trackedConnPromise),
  ]);
  pool.push(trackedConnPromise);

  while (true) {
    const [reqOrConn, untrack] = await Promise.race(pool);
    untrack(); // remove from pool
    if (!Array.isArray(reqOrConn)) {
      // result is not array, means from connPromise
      // Push readRequest promise for conn
      const trackedReqPromise = readRequest(reqOrConn)
        .then((maybeReq) => [
          maybeReq,
          untrackFromPool.bind(null, trackedReqPromise)
        ]);
      pool.push(trackedReqPromise);
      // Prepared to accept another connection (avoid starving)
      trackedConnPromise = listener.accept().then(conn => [
        conn,
        untrackFromPool.bind(null, trackedConnPromise),
      ]);
      pool.push(trackedConnPromise);
    } else {
      // TODO: handle _err
      const [req, _err] = reqOrConn as [ServerRequest, BufState];
      yield req;
    }
  }
  listener.close();
}

interface Response {
  status?: number;
  headers?: Headers;
  body?: Uint8Array;
}

function setContentLength(r: Response): void {
  if (r.body) {
    if (!r.headers) {
      r.headers = new Headers();
    }
    if (!r.headers.has("content-length")) {
      r.headers.append("Content-Length", r.body.byteLength.toString());
    }
  }
}

class ServerRequest {
  url: string;
  method: string;
  proto: string;
  headers: Headers;
  w: BufWriter;
  _conn: Conn;

  async respond(r: Response): Promise<void> {
    const protoMajor = 1;
    const protoMinor = 1;
    const statusCode = r.status || 200;
    const statusText = STATUS_TEXT.get(statusCode);
    if (!statusText) {
      throw Error("bad status code");
    }

    let out = `HTTP/${protoMajor}.${protoMinor} ${r.status} ${statusText}\r\n`;

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
      n = await this.w.write(r.body);
      assert(r.body.byteLength == n);
    }

    await this.w.flush();
    // TODO: handle keep alive
    this._conn.close();
  }
}

async function readRequest(c: Conn): Promise<[ServerRequest, BufState]> {
  const bufr = new BufReader(c);
  const bufw = new BufWriter(c);
  const req = new ServerRequest();
  req.w = bufw;
  req._conn = c;
  const tp = new TextProtoReader(bufr);

  let s: string;
  let err: BufState;

  // First line: GET /index.html HTTP/1.0
  [s, err] = await tp.readLine();
  if (err) {
    return [null, err];
  }
  [req.method, req.url, req.proto] = s.split(" ", 3);

  [req.headers, err] = await tp.readMIMEHeader();

  // TODO: handle body

  return [req, err];
}
