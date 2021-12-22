// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any ban-types

import { notImplemented } from "./_utils.ts";
import { Readable, Writable } from "./stream.ts";
import { urlToHttpOptions } from "./internal/url.ts";

export class Agent {
  constructor() {
    notImplemented();
  }
}
export class Server {
  constructor() {
    notImplemented();
  }
}
export function createServer() {
  notImplemented();
}

interface RequestOptions {
  agent?: Agent | boolean;
  auth?: string;
  createConnection?: Function;
  defaultPort?: number;
  family?: number;
  headers?: Object;
  hints?: number;
  host?: string;
  hostname?: string;
  insecureHTTPParser?: boolean;
  localAddress?: string;
  localPort?: number;
  lookup?: Function;
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

// Store additional root CAs.
// undefined means NODE_EXTRA_CA_CERTS is not checked yet.
// null means there's no additional root CAs.
let caCerts: string[] | undefined | null;

/** Makes a request to an https server. */
export function get(
  url: string | URL,
  cb?: (res: HttpsIncomingMessage) => void,
): HttpsClientRequest;
export function get(
  opts: RequestOptions,
  cb?: (res: HttpsIncomingMessage) => void,
): HttpsClientRequest;
export function get(
  url: string | URL,
  opts: RequestOptions,
  cb?: (res: HttpsIncomingMessage) => void,
): HttpsClientRequest;
export function get(...args: any[]) {
  const req = request(args[0], args[1], args[2]);
  req.end();
  return req;
}

export const globalAgent = undefined;
/** HttpsClientRequest class loosely follows http.ClientRequest class API. */
class HttpsClientRequest extends Writable {
  body: null | ReadableStream = null;
  controller: ReadableStreamDefaultController | null = null;
  constructor(
    public opts: RequestOptions,
    public cb: (res: HttpsIncomingMessage) => void,
  ) {
    super();
  }

  _write(chunk: any, _enc: string, cb: () => void) {
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

  async _final() {
    const client = await this.#createCustomClient();
    const opts = { body: this.body, method: this.opts.method, client };
    const res = new HttpsIncomingMessage(await fetch(this.opts.href!, opts));
    if (client) {
      res.on("end", () => {
        client.close();
      });
    }
    this.cb(res);
  }

  async #createCustomClient(): Promise<Deno.HttpClient | undefined> {
    if (caCerts === null) {
      return undefined;
    }
    if (caCerts !== undefined) {
      return Deno.createHttpClient({ caCerts });
    }
    const status = await Deno.permissions.query({
      name: "env",
      variable: "NODE_EXTRA_CA_CERTS",
    });
    if (status.state !== "granted") {
      caCerts = null;
      return undefined;
    }
    const certFilename = Deno.env.get("NODE_EXTRA_CA_CERTS");
    if (!certFilename) {
      caCerts = null;
      return undefined;
    }
    const caCert = await Deno.readTextFile(certFilename);
    caCerts = [caCert];
    return Deno.createHttpClient({ caCerts });
  }
}

/** HttpsIncomingMessage class loosely follows http.IncomingMessage class API. */
class HttpsIncomingMessage extends Readable {
  reader: ReadableStreamDefaultReader | undefined;
  constructor(public resp: Response) {
    super();
    this.reader = resp.body?.getReader();
  }

  async _read(_size: number) {
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
      this.destroy(e);
    }
  }

  get headers() {
    return this.resp.headers;
  }

  get statusCode() {
    return this.resp.status;
  }

  get statusMessage() {
    return this.resp.statusText;
  }
}

/** Makes a request to an https server. */
export function request(
  url: string | URL,
  cb?: (res: HttpsIncomingMessage) => void,
): HttpsClientRequest;
export function request(
  opts: RequestOptions,
  cb?: (res: HttpsIncomingMessage) => void,
): HttpsClientRequest;
export function request(
  url: string | URL,
  opts: RequestOptions,
  cb?: (res: HttpsIncomingMessage) => void,
): HttpsClientRequest;
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
  return new HttpsClientRequest(args[0], args[1]);
}
export default {
  Agent,
  Server,
  createServer,
  get,
  globalAgent,
  request,
};
