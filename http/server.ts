// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { delay } from "../async/mod.ts";

/**
 * Thrown by Server after it has been closed.
 */
const ERROR_SERVER_CLOSED = "Server closed";

/**
 * Thrown when parsing an invalid address string.
 */
const ERROR_ADDRESS_INVALID = "Invalid address";

/**
 * Default port for serving HTTP.
 */
const HTTP_PORT = 80;

/**
 * Default port for serving HTTPS.
 */
const HTTPS_PORT = 443;

/**
 * Initial backoff delay of 5ms following a temporary accept failure.
 */
const INITIAL_ACCEPT_BACKOFF_DELAY = 5;

/**
 * Max backoff delay of 1s following a temporary accept failure.
 */
const MAX_ACCEPT_BACKOFF_DELAY = 1000;

/**
 * Information about the connection a request arrived on.
 */
export interface ConnInfo {
  /**
   * The local address of the connection.
   */
  readonly localAddr: Deno.Addr;
  /**
   * The remote address of the connection.
   */
  readonly remoteAddr: Deno.Addr;
}

/**
 * A handler for HTTP requests. Consumes a request and connection information
 * and returns a response.
 *
 * If a handler throws, the server calling the handler will assume the impact
 * of the error is isolated to the individual request. It will catch the error
 * and close the underlying connection.
 */
export type Handler = (
  request: Request,
  connInfo: ConnInfo,
) => Response | Promise<Response>;

/**
 * Parse an address from a string. When only the port is given, the hostname
 * defaults to 127.0.0.1
 *
 * ```ts
 * import { _parseAddrFromStr } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const addr = "::1:8000";
 * const listenOptions = _parseAddrFromStr(addr);
 * ```
 *
 * @param {string} addr The address string to parse.
 * @param {number} defaultPort Default port when not included in the address string.
 * @return {Deno.ListenOptions} The parsed address.
 * @throws {TypeError} When the address is invalid.
 * @private
 */
export function _parseAddrFromStr(
  addr: string,
  defaultPort = HTTP_PORT,
): Deno.ListenOptions {
  const host = addr.startsWith(":") ? `127.0.0.1${addr}` : addr;

  let url: URL;

  try {
    url = new URL(`http://${host}`);
  } catch {
    throw new TypeError(ERROR_ADDRESS_INVALID);
  }

  if (
    url.username ||
    url.password ||
    url.pathname != "/" ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(ERROR_ADDRESS_INVALID);
  }

  return {
    hostname: url.hostname,
    port: url.port === "" ? defaultPort : Number(url.port),
  };
}

/**
 * Options for running an HTTP server.
 */
export interface ServerInit {
  /**
   * Optionally specifies the address to listen on, in the form
   * "host:port".
   *
   * If the port is omitted, ":80" is used by default for HTTP when invoking
   * non-TLS methods such as `Server.listenAndServe`, and ":443" is
   * used by default for HTTPS when invoking TLS methods such as
   * `server.listenAndServeTls`.
   *
   * If the host is omitted, the non-routable meta-address "0.0.0.0" is used.
   */
  addr?: string;

  /**
   * The handler to invoke for individual HTTP requests.
   */
  handler: Handler;
}

/**
 * Used to construct an HTTP server.
 */
export class Server {
  #addr?: string;
  #handler: Handler;
  #closed = false;
  #listeners: Set<Deno.Listener> = new Set();
  #httpConnections: Set<Deno.HttpConn> = new Set();

  /**
   * Constructs a new HTTP Server instance.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const addr = ":4505";
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ addr, handler });
   * ```
   *
   * @param {ServerInit} serverInit Options for running an HTTP server.
   */
  constructor(serverInit: ServerInit) {
    this.#addr = serverInit.addr;
    this.#handler = serverInit.handler;
  }

  /**
   * Accept incoming connections on the given listener, and handle requests on
   * these connections with the given handler.
   *
   * HTTP/2 support is only enabled if the provided Deno.Listener returns TLS
   * connections and was configured with "h2" in the ALPN protocols.
   *
   * Throws a server closed error if called after the server has been closed.
   *
   * Will always close the created listener.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ handler });
   * const listener = Deno.listen({ port: 4505 });
   *
   * await server.serve(listener);
   * ```
   *
   * @param {Deno.Listener} listener The listener to accept connections from.
   * @throws {Deno.errors.Http} When the server has already been closed.
   */
  async serve(listener: Deno.Listener): Promise<void> {
    if (this.#closed) {
      throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
    }

    this.#trackListener(listener);

    try {
      return await this.#accept(listener);
    } finally {
      this.#untrackListener(listener);

      try {
        listener.close();
      } catch {
        // Listener has already been closed.
      }
    }
  }

  /**
   * Create a listener on the server, accept incoming connections, and handle
   * requests on these connections with the given handler.
   *
   * If the server was constructed without an address, ":80" is used.
   *
   * Throws a server closed error if the server has been closed.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const addr = ":4505";
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ addr, handler });
   * await server.listenAndServe();
   * ```
   *
   * @throws {Deno.errors.Http} When the server has already been closed.
   */
  async listenAndServe(): Promise<void> {
    if (this.#closed) {
      throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
    }

    const addr = this.#addr ?? `:${HTTP_PORT}`;
    const listenOptions = _parseAddrFromStr(addr, HTTP_PORT);

    const listener = Deno.listen({
      ...listenOptions,
      transport: "tcp",
    });

    return await this.serve(listener);
  }

  /**
   * Create a listener on the server, accept incoming connections, upgrade them
   * to TLS, and handle requests on these connections with the given handler.
   *
   * If the server was constructed without an address, ":443" is used.
   *
   * Throws a server closed error if the server has been closed.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const addr = ":4505";
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ addr, handler });
   *
   * const certFile = "/path/to/certFile.crt";
   * const keyFile = "/path/to/keyFile.key";
   *
   * await server.listenAndServeTls(certFile, keyFile);
   * ```
   *
   * @param {string} certFile The path to the file containing the TLS certificate.
   * @param {string} keyFile The path to the file containing the TLS private key.
   * @throws {Deno.errors.Http} When the server has already been closed.
   */
  async listenAndServeTls(certFile: string, keyFile: string): Promise<void> {
    if (this.#closed) {
      throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
    }

    const addr = this.#addr ?? `:${HTTPS_PORT}`;
    const listenOptions = _parseAddrFromStr(addr, HTTPS_PORT);

    const listener = Deno.listenTls({
      ...listenOptions,
      certFile,
      keyFile,
      transport: "tcp",
      // ALPN protocol support not yet stable.
      // alpnProtocols: ["h2", "http/1.1"],
    });

    return await this.serve(listener);
  }

  /**
   * Immediately close the server listeners and associated HTTP connections.
   *
   * Throws a server closed error if called after the server has been closed.
   *
   * @throws {Deno.errors.Http} When the server has already been closed.
   */
  close(): void {
    if (this.#closed) {
      throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
    }

    this.#closed = true;

    for (const listener of this.#listeners) {
      try {
        listener.close();
      } catch {
        // Listener has already been closed.
      }
    }

    this.#listeners.clear();

    for (const httpConn of this.#httpConnections) {
      this.#closeHttpConn(httpConn);
    }

    this.#httpConnections.clear();
  }

  /**
   * Get whether the server is closed.
   */
  get closed(): boolean {
    return this.#closed;
  }

  /**
   * Get the list of network addresses the server is listening on.
   */
  get addrs(): Deno.Addr[] {
    return Array.from(this.#listeners).map((listener) => listener.addr);
  }

  /**
   * Responds to an HTTP request.
   *
   * @param {Deno.RequestEvent} requestEvent The HTTP request to respond to.
   * @param {Deno.HttpConn} httpCon The HTTP connection to yield requests from.
   * @param {ConnInfo} connInfo Information about the underlying connection.
   * @private
   */
  async #respond(
    requestEvent: Deno.RequestEvent,
    httpCon: Deno.HttpConn,
    connInfo: ConnInfo,
  ): Promise<void> {
    try {
      // Handle the request event, generating a response.
      const response = await this.#handler(
        requestEvent.request,
        connInfo,
      );

      // Send the response.
      await requestEvent.respondWith(response);
    } catch {
      // If the handler throws then it is assumed that the impact of the error
      // is isolated to the individual request, so we close the connection.
      //
      // Alternatively the connection has already been closed, or there is some
      // other error with responding on this connection that prompts us to
      // close it and open a new connection.
      return this.#closeHttpConn(httpCon);
    }
  }

  /**
   * Serves all HTTP requests on a single connection.
   *
   * @param {Deno.HttpConn} httpConn The HTTP connection to yield requests from.
   * @param {ConnInfo} connInfo Information about the underlying connection.
   * @private
   */
  async #serveHttp(
    httpConn: Deno.HttpConn,
    connInfo: ConnInfo,
  ): Promise<void> {
    while (!this.#closed) {
      let requestEvent: Deno.RequestEvent | null;

      try {
        // Yield the new HTTP request on the connection.
        requestEvent = await httpConn.nextRequest();
      } catch {
        // Connection has been closed.
        break;
      }

      if (requestEvent === null) {
        // Connection has been closed.
        break;
      }

      // Respond to the request. Note we do not await this async method to
      // allow the connection to handle multiple requests in the case of h2.
      this.#respond(requestEvent, httpConn, connInfo);
    }

    this.#closeHttpConn(httpConn);
  }

  /**
   * Accepts all connections on a single network listener.
   *
   * @param {Deno.Listener} listener The listener to accept connections from.
   * @private
   */
  async #accept(
    listener: Deno.Listener,
  ): Promise<void> {
    let acceptBackoffDelay: number | undefined;

    while (!this.#closed) {
      let conn: Deno.Conn;

      try {
        // Wait for a new connection.
        conn = await listener.accept();
      } catch (error) {
        if (
          // The listener is closed.
          error instanceof Deno.errors.BadResource ||
          // TLS handshake errors.
          error instanceof Deno.errors.InvalidData ||
          error instanceof Deno.errors.UnexpectedEof ||
          error instanceof Deno.errors.ConnectionReset ||
          error instanceof Deno.errors.NotConnected
        ) {
          // Backoff after transient errors to allow time for the system to
          // recover, and avoid blocking up the event loop with a continuously
          // running loop.
          if (!acceptBackoffDelay) {
            acceptBackoffDelay = INITIAL_ACCEPT_BACKOFF_DELAY;
          } else {
            acceptBackoffDelay *= 2;
          }

          if (acceptBackoffDelay >= MAX_ACCEPT_BACKOFF_DELAY) {
            acceptBackoffDelay = MAX_ACCEPT_BACKOFF_DELAY;
          }

          await delay(acceptBackoffDelay);

          continue;
        }

        throw error;
      }

      acceptBackoffDelay = undefined;

      // "Upgrade" the network connection into an HTTP connection.
      let httpConn: Deno.HttpConn;

      try {
        httpConn = Deno.serveHttp(conn);
      } catch {
        // Connection has been closed.
        continue;
      }

      // Closing the underlying listener will not close HTTP connections, so we
      // track for closure upon server close.
      this.#trackHttpConnection(httpConn);

      const connInfo: ConnInfo = {
        localAddr: conn.localAddr,
        remoteAddr: conn.remoteAddr,
      };

      // Serve the requests that arrive on the just-accepted connection. Note
      // we do not await this async method to allow the server to accept new
      // connections.
      this.#serveHttp(httpConn, connInfo);
    }
  }

  /**
   * Untracks and closes an HTTP connection.
   *
   * @param {Deno.HttpConn} httpConn The HTTP connection to close.
   * @private
   */
  #closeHttpConn(httpConn: Deno.HttpConn): void {
    this.#untrackHttpConnection(httpConn);

    try {
      httpConn.close();
    } catch {
      // Connection has already been closed.
    }
  }

  /**
   * Adds the listener to the internal tracking list.
   *
   * @param {Deno.Listener} listener Listener to track.
   * @private
   */
  #trackListener(listener: Deno.Listener): void {
    this.#listeners.add(listener);
  }

  /**
   * Removes the listener from the internal tracking list.
   *
   * @param {Deno.Listener} listener Listener to untrack.
   * @private
   */
  #untrackListener(listener: Deno.Listener): void {
    this.#listeners.delete(listener);
  }

  /**
   * Adds the HTTP connection to the internal tracking list.
   *
   * @param {Deno.HttpConn} httpConn HTTP connection to track.
   * @private
   */
  #trackHttpConnection(httpConn: Deno.HttpConn): void {
    this.#httpConnections.add(httpConn);
  }

  /**
   * Removes the HTTP connection from the internal tracking list.
   *
   * @param {Deno.HttpConn} httpConn HTTP connection to untrack.
   * @private
   */
  #untrackHttpConnection(httpConn: Deno.HttpConn): void {
    this.#httpConnections.delete(httpConn);
  }
}

/**
 * Additional serve options.
 */
export interface ServeInit {
  /**
   * An AbortSignal to close the server and all connections.
   */
  signal?: AbortSignal;
}

/**
 * Constructs a server, accepts incoming connections on the given listener, and
 * handles requests on these connections with the given handler.
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const listener = Deno.listen({ port: 4505 });
 *
 * await serve(listener, (request) => {
 *   const body = `Your user-agent is:\n\n${request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   return new Response(body, { status: 200 });
 * });
 * ```
 *
 * @param {Deno.Listener} listener The listener to accept connections from.
 * @param {Handler} handler The handler for individual HTTP requests.
 * @param {ServeInit} [options] Additional serve options.
 */
export async function serve(
  listener: Deno.Listener,
  handler: Handler,
  options?: ServeInit,
): Promise<void> {
  const server = new Server({ handler });

  if (options?.signal) {
    options.signal.onabort = () => server.close();
  }

  return await server.serve(listener);
}

/**
 * Constructs a server, creates a listener on the given address, accepts
 * incoming connections, and handles requests on these connections with the
 * given handler.
 *
 * If the server was constructed without an address, ":80" is used.
 *
 * ```ts
 * import { listenAndServe } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const addr = ":4505";
 *
 * await listenAndServe(addr, (request) => {
 *   const body = `Your user-agent is:\n\n${request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   return new Response(body, { status: 200 });
 * });
 * ```
 *
 * @param {string} addr The address to listen on.
 * @param {Handler} handler The handler for individual HTTP requests.
 * @param {ServeInit} [options] Additional serve options.
 */
export async function listenAndServe(
  addr: string,
  handler: Handler,
  options?: ServeInit,
): Promise<void> {
  const server = new Server({ addr, handler });

  if (options?.signal) {
    options.signal.onabort = () => server.close();
  }

  return await server.listenAndServe();
}

/**
 * Constructs a server, creates a listener on the given address, accepts
 * incoming connections, upgrades them to TLS, and handles requests on these
 * connections with the given handler.
 *
 * If the server was constructed without an address, ":443" is used.
 *
 * ```ts
 * import { listenAndServeTls } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const addr = ":4505";
 * const certFile = "/path/to/certFile.crt";
 * const keyFile = "/path/to/keyFile.key";
 *
 * await listenAndServeTls(addr, certFile, keyFile, (request) => {
 *   const body = `Your user-agent is:\n\n${request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   return new Response(body, { status: 200 });
 * });
 * ```
 *
 * @param {string} addr The address to listen on.
 * @param {string} certFile The path to the file containing the TLS certificate.
 * @param {string} keyFile The path to the file containing the TLS private key.
 * @param {Handler} handler The handler for individual HTTP requests.
 * @param {ServeInit} [options] Additional serve options.
 */
export async function listenAndServeTls(
  addr: string,
  certFile: string,
  keyFile: string,
  handler: Handler,
  options?: ServeInit,
): Promise<void> {
  const server = new Server({ addr, handler });

  if (options?.signal) {
    options.signal.onabort = () => server.close();
  }

  return await server.listenAndServeTls(certFile, keyFile);
}
