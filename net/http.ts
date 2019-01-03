import { listen, Conn, toAsyncIterator, Reader, copy, DenoError, ErrorKind ,stat, readDir, open } from "deno";
import { BufReader, BufState, BufWriter } from "./bufio.ts";
import { TextProtoReader } from "./textproto.ts";
import { STATUS_TEXT } from "./http_status.ts";
import { assert } from "./util.ts";
import { extname } from "../path/index.ts";
import * as extensionsMap from "./extension_map.json";

const dirViewerTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Deno File Server</title>
  <style>
    td {
      padding: 0 1rem;
    }
    td.mode {
      font-family: Courier;
    }
  </style>
</head>
<body>
  <h1>Index of <%DIRNAME%></h1>
  <table>
    <tr><th>Mode</th><th>Size</th><th>Name</th></tr>
    <%CONTENTS%>
  </table>
</body>
</html>
`;

const encoder = new TextEncoder();

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

/** Continuously read more requests from conn until EOF
 * Calls maybeHandleReq.
 * bufr is empty on a fresh TCP connection.
 * Would be passed around and reused for later request on same conn
 * TODO: make them async function after this change is done
 * https://github.com/tc39/ecma262/pull/1250
 * See https://v8.dev/blog/fast-async
 */
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

  public async *bodyStream() {
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
    } else {
      if (this.headers.has("transfer-encoding")) {
        const transferEncodings = this.headers
          .get("transfer-encoding")
          .split(",")
          .map(e => e.trim().toLowerCase());
        if (transferEncodings.includes("chunked")) {
          // Based on https://tools.ietf.org/html/rfc2616#section-19.4.6
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
          return; // Must return here to avoid fall through
        }
        // TODO: handle other transfer-encoding types
      }
      // Otherwise...
      yield new Uint8Array(0);
    }
  }

  // Read the body of the request into a single Uint8Array
  public async body(): Promise<Uint8Array> {
    return readAllIterator(this.bodyStream());
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

async function readAllIterator(
  it: AsyncIterableIterator<Uint8Array>
): Promise<Uint8Array> {
  const chunks = [];
  let len = 0;
  for await (const chunk of it) {
    chunks.push(chunk);
    len += chunk.length;
  }
  if (chunks.length === 0) {
    // No need for copy
    return chunks[0];
  }
  const collected = new Uint8Array(len);
  let offset = 0;
  for (let chunk of chunks) {
    collected.set(chunk, offset);
    offset += chunk.length;
  }
  return collected;
}


function modeToString(isDir: boolean, maybeMode: number | null) {
  const modeMap = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];

  if (maybeMode === null) {
    return "(unknown mode)";
  }
  const mode = maybeMode!.toString(8);
  if (mode.length < 3) {
    return "(unknown mode)";
  }
  let output = "";
  mode
    .split("")
    .reverse()
    .slice(0, 3)
    .forEach(v => {
      output = modeMap[+v] + output;
    });
  output = `(${isDir ? "d" : "-"}${output})`;
  return output;
}

function fileLenToString(len: number) {
  const multipler = 1024;
  let base = 1;
  const suffix = ["B", "K", "M", "G", "T"];
  let suffixIndex = 0;

  while (base * multipler < len) {
    if (suffixIndex >= suffix.length - 1) {
      break;
    }
    base *= multipler;
    suffixIndex++;
  }

  return `${(len / base).toFixed(2)}${suffix[suffixIndex]}`;
}

function createDirEntryDisplay(
  name: string,
  path: string,
  size: number | null,
  mode: number | null,
  isDir: boolean
) {
  const sizeStr = size === null ? "" : "" + fileLenToString(size!);
  return `
  <tr><td class="mode">${modeToString(
    isDir,
    mode
  )}</td><td>${sizeStr}</td><td><a href="${path}">${name}${
    isDir ? "/" : ""
  }</a></td>
  </tr>
  `;
}

// TODO: simplify this after deno.stat and deno.readDir are fixed
async function serveDir(req: ServerRequest, dirPath: string, dirName: string) {
  // dirname has no prefix
  const listEntry: string[] = [];
  const fileInfos = await readDir(dirPath);
  for (const info of fileInfos) {
    if (info.name === "index.html" && info.isFile()) {
      // in case index.html as dir...
      return await serveFile(req, info.path);
    }
    // Yuck!
    let mode = null;
    try {
      mode = (await stat(info.path)).mode;
    } catch (e) {}
    listEntry.push(
      createDirEntryDisplay(
        info.name,
        dirName + "/" + info.name,
        info.isFile() ? info.len : null,
        mode,
        info.isDirectory()
      )
    );
  }

  const page = new TextEncoder().encode(
    dirViewerTemplate
      .replace("<%DIRNAME%>", dirName + "/")
      .replace("<%CONTENTS%>", listEntry.join(""))
  );

  const headers = new Headers();
  headers.set("content-type", "text/html");

  const res = {
    status: 200,
    body: page,
    headers
  };
  setContentLength(res);
  return res;
}

function guessContentType(filename: string): string {
  let extension = extname(filename);
  let contentType = extensionsMap[extension];

  if (contentType) {
    return contentType;
  }

  extension = extension.toLowerCase();
  contentType = extensionsMap[extension];

  if (contentType) {
    return contentType;
  }

  return extensionsMap[""];
}

async function serveFile(req: ServerRequest, filename: string) {
  const file = await open(filename);
  const fileInfo = await stat(filename);
  const headers = new Headers();
  headers.set("content-length", fileInfo.len.toString());
  headers.set("content-type", guessContentType(filename));
  const res = {
    status: 200,
    body: file,
    headers
  };
  return res;
}

async function serveFallback(req: ServerRequest, e: Error) {
  if (
    e instanceof DenoError &&
    (e as DenoError<any>).kind === ErrorKind.NotFound
  ) {
    return {
      status: 404,
      body: encoder.encode("Not found")
    };
  } else {
    return {
      status: 500,
      body: encoder.encode("Internal server error")
    };
  }
}

function serverLog(req: ServerRequest, res: Response) {
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const s = `${dateFmt} "${req.method} ${req.url} ${req.proto}" ${res.status}`;
  console.log(s);
}

function setCORS(res: Response) {
  if (!res.headers) {
    res.headers = new Headers();
  }
  res.headers!.append("access-control-allow-origin", "*");
  res.headers!.append(
    "access-control-allow-headers",
    "Origin, X-Requested-With, Content-Type, Accept, Range"
  );
}


export function fileServer(currentDir, addr: string, options: {
  cors: boolean
}) {
  listenAndServe(addr, async req => {
    const fileName = req.url.replace(/\/$/, "");
    const filePath = currentDir + fileName;
  
    let response: Response;
  
    try {
      const fileInfo = await stat(filePath);
      if (fileInfo.isDirectory()) {
        // Bug with deno.stat: name and path not populated
        // Yuck!
        response = await serveDir(req, filePath, fileName);
      } else {
        response = await serveFile(req, filePath);
      }
    } catch (e) {
      response = await serveFallback(req, e);
    } finally {
      if (options.cors) {
        setCORS(response);
      }
      serverLog(req, response);
      req.respond(response);
    }
  });
  console.log(`HTTP server listening on http://${addr}/`);
}

