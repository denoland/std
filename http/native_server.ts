// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { _parseAddrFromStr } from "./server.ts";
import { MuxAsyncIterator } from "../async/mod.ts";

/**
 * Thrown by Server serve-like methods after the server has been closed.
 */
const ERROR_SERVER_CLOSED = new Deno.errors.Http("Server closed");

/**
 * Thrown when attempting to respond to a ServerRequest when a response has
 * already been sent.
 */
const ERROR_RESPONSE_SENT = new Deno.errors.BadResource(
  "Response already sent",
);

/**
 * Default port for serving HTTP.
 */
const HTTP_PORT = 80;

/**
 * Default port for serving HTTPS.
 */
const HTTPS_PORT = 443;

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
 */
export type Handler = (
  request: Request,
  connInfo: ConnInfo,
) => Response | Promise<Response>;

export class ServerRequest implements Deno.RequestEvent {
  #request: Request;
  #connInfo: ConnInfo;
  #responsePromise: Promise<void>;
  #resolver!: (value: Response | Promise<Response>) => void;
  #done = false;

  /**
   * Constructs a new ServerRequest instance.
   *
   * @param {Deno.RequestEvent} requestEvent
   * @param {Deno.Conn} conn
   */
  constructor(requestEvent: Deno.RequestEvent, conn: Deno.Conn) {
    this.#request = requestEvent.request;
    this.#connInfo = {
      localAddr: conn.localAddr,
      remoteAddr: conn.remoteAddr,
    };

    const wrappedResponse = new Promise<Response>((resolve) => {
      this.#resolver = resolve;
    });

    this.#responsePromise = requestEvent.respondWith(wrappedResponse);
  }

  /**
   * Get the Request instance.
   */
  get request(): Request {
    return this.#request;
  }

  /**
   * Get the connection info.
   */
  get connInfo(): ConnInfo {
    return this.#connInfo;
  }

  /**
   * Determine whether the response has completed.
   */
  get done(): Promise<void> {
    return this.#responsePromise;
  }

  /**
   * Send a response to the request.
   *
   * @param {Response|Promise<Response>} response Response to the request.
   * @throws {Deno.errors.BadResource} When the response has already been sent.
   */
  respondWith(response: Response | Promise<Response>): Promise<void> {
    if (this.#done) {
      throw ERROR_RESPONSE_SENT;
    }

    this.#resolver(response);
    this.#done = true;

    return this.#responsePromise;
  }
}

/**
 * Options for running a server.
 */
export interface ServerInit {
  /**
   * Optionally specifies the TCP address to listen on, in the form
   * `host:port`. If not provided, ":80" is used by default for HTTP and ":443"
   * is used by default for HTTPS.
   */
  addr?: string;

  /**
   * The handler for individual HTTP requests.
   */
  handler: Handler;
}

export class Server {
  addr?: string;
  handler: Handler;
  #closed = false;
  #listeners: Set<Deno.Listener> = new Set();
  #httpConnections: Set<Deno.HttpConn> = new Set();

  /**
   * Constructs a new Server instance.
   *
   * @param {ServerInit} options Options for running a server.
   */
  constructor({ addr, handler }: ServerInit) {
    this.addr = addr;
    this.handler = handler;
  }

  /**
   * Accept incoming connections on the given listener, and handle requests on
   * these connections with the given handler.
   *
   * Throws a server closed error if called after the server has been closed.
   *
   * Will always close the listener.
   *
   * @param {Deno.Listener} listener The listener to accept connections from.
   * @throws {Deno.errors.Http} When the server has been closed.
   */
  async serve(listener: Deno.Listener): Promise<void> {
    if (this.#closed) {
      throw ERROR_SERVER_CLOSED;
    }

    this.trackListener(listener);

    const mux = this.serveMux(listener);

    try {
      for await (const requestEvent of mux) {
        requestEvent.respondWith(this.handler(
          requestEvent.request,
          requestEvent.connInfo,
        ));
      }
    } finally {
      this.untrackListener(listener);

      try {
        listener.close();
      } catch (error) {
        if (!(error instanceof Deno.errors.BadResource)) {
          throw error;
        }
      }
    }
  }

  /**
   * Create a listener on the server, accept incoming connections, and handle
   * requests on these connections with the given handler.
   *
   * Throws a server closed error if the server has been closed.
   *
   * @throws {Deno.errors.Http} When the server has been closed.
   */
  async listenAndServe(): Promise<void> {
    if (this.#closed) {
      throw ERROR_SERVER_CLOSED;
    }

    const addr = this.addr ?? `:${HTTP_PORT}`;
    const listenOptions = _parseAddrFromStr(addr, HTTP_PORT);

    const listener = Deno.listen({
      ...listenOptions,
      transport: "tcp",
    });

    try {
      return await this.serve(listener);
    } finally {
      try {
        listener.close();
      } catch (error) {
        if (!(error instanceof Deno.errors.BadResource)) {
          throw error;
        }
      }
    }
  }

  /**
   * Create a listener on the server, accept incoming connections, upgrade them
   * to TLS, and handle requests on these connections with the given handler.
   *
   * Throws a server closed error if the server has been closed.
   *
   * @param {string} certFile The path to the file containing the TLS certificate.
   * @param {string} keyFile The path to the file containing the TLS private key.
   * @throws {Deno.errors.Http} When the server has been closed.
   */
  async listenAndServeTls(certFile: string, keyFile: string): Promise<void> {
    if (this.#closed) {
      throw ERROR_SERVER_CLOSED;
    }

    const addr = this.addr ?? `:${HTTPS_PORT}`;
    const listenOptions = _parseAddrFromStr(addr, HTTPS_PORT);

    const listener = Deno.listenTls({
      ...listenOptions,
      certFile,
      keyFile,
      transport: "tcp",
      // ALPN protocol support not yet stable.
      // alpnProtocols: ["h2", "http/1.1"],
    });

    try {
      return await this.serve(listener);
    } finally {
      try {
        listener.close();
      } catch (error) {
        if (!(error instanceof Deno.errors.BadResource)) {
          throw error;
        }
      }
    }
  }

  /**
   * Immediately close the server listeners and associated HTTP connections.
   */
  close(): void {
    this.#closed = true;

    for (const listener of this.#listeners) {
      try {
        listener.close();
      } catch (error) {
        if (!(error instanceof Deno.errors.BadResource)) {
          throw error;
        }
      }
    }

    this.#listeners.clear();

    for (const httpConn of this.#httpConnections) {
      try {
        httpConn.close();
      } catch (error) {
        if (!(error instanceof Deno.errors.BadResource)) {
          throw error;
        }
      }
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
   * Yields all HTTP requests on a single TCP connection.
   *
   * @param {Deno.HttpConn} httpConn The HTTP connection to yield requests from.
   * @param {Deno.Conn} conn The TCP connection.
   * @yields {ServerRequest} HTTP request events.
   * @private
   */
  private async *iterateHttpRequests(
    httpConn: Deno.HttpConn,
    conn: Deno.Conn,
  ): AsyncIterableIterator<ServerRequest> {
    while (!this.#closed) {
      let requestEvent!: Deno.RequestEvent | null;

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

      // Wrap request event so can gracefully handle and await async ops.
      const serverRequest = new ServerRequest(requestEvent, conn);

      // Consumer can handle the request event.
      yield serverRequest;

      try {
        // Wait for the request to be processed before we accept a new request
        // on this connection.
        await serverRequest.done;
      } catch {
        // Connection has been closed.
        break;
      }
    }

    this.untrackHttpConnection(httpConn);

    try {
      httpConn.close();
    } catch (error) {
      if (!(error instanceof Deno.errors.BadResource)) {
        throw error;
      }
    }
  }

  /**
   * Accepts a new TCP connection and yields all HTTP requests that arrive on
   * it. When a connection is accepted, it also creates a new iterator of the
   * same kind and adds it to the request multiplexer so that another TCP
   * connection can be accepted.
   *
   * @param {MuxAsyncIterator<ServerRequest>} mux Request multiplexer.
   * @param {Deno.Listener} listener The listener to accept connections from.
   * @yields {ServerRequest}
   * @private
   */
  private async *acceptConnAndIterateHttpRequests(
    mux: MuxAsyncIterator<ServerRequest>,
    listener: Deno.Listener,
  ): AsyncIterableIterator<ServerRequest> {
    if (this.#closed) {
      return;
    }

    // Wait for a new connection.
    let conn: Deno.Conn;

    try {
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
        return mux.add(this.acceptConnAndIterateHttpRequests(mux, listener));
      }

      throw error;
    }

    // "Upgrade" the network connection into an HTTP connection.
    const httpConn = Deno.serveHttp(conn);

    // Closing the underlying listener will not close HTTP connections, so we
    // track for closure upon server close.
    this.trackHttpConnection(httpConn);

    // Try to accept another connection and add it to the multiplexer.
    mux.add(this.acceptConnAndIterateHttpRequests(mux, listener));

    // Yield the requests that arrive on the just-accepted connection.
    yield* this.iterateHttpRequests(httpConn, conn);
  }

  /**
   * Adds the listener to the internal tracking list.
   *
   * @param {Deno.Listener} listener Listener to track.
   * @private
   */
  private trackListener(listener: Deno.Listener): void {
    this.#listeners.add(listener);
  }

  /**
   * Removes the listener from the internal tracking list.
   *
   * @param {Deno.Listener} listener Listener to untrack.
   * @private
   */
  private untrackListener(listener: Deno.Listener): void {
    this.#listeners.delete(listener);
  }

  /**
   * Adds the HTTP connection to the internal tracking list.
   *
   * @param {Deno.HttpConn} httpConn HTTP connection to track.
   * @private
   */
  private trackHttpConnection(httpConn: Deno.HttpConn): void {
    this.#httpConnections.add(httpConn);
  }

  /**
   * Removes the HTTP connection from the internal tracking list.
   *
   * @param {Deno.HttpConn} httpConn HTTP connection to untrack.
   * @private
   */
  private untrackHttpConnection(httpConn: Deno.HttpConn): void {
    this.#httpConnections.delete(httpConn);
  }

  /**
   * Multiplexes multiple connection request events into a single stream.
   *
   * @returns {AsyncIterableIterator<ServerRequest>} The async iterator.
   * @private
   */
  private serveMux(
    listener: Deno.Listener,
  ): AsyncIterableIterator<ServerRequest> {
    const mux = new MuxAsyncIterator<ServerRequest>();

    mux.add(this.acceptConnAndIterateHttpRequests(mux, listener));

    return mux.iterate();
  }
}

/**
 * Additional serve options.
 */
export interface ServeInit {
  /**
   * An AbortSignal close the server and all connections.
   */
  signal?: AbortSignal;
}

/**
 * Accept incoming connections on the given listener, and handle requests on
 * these connections with the given handler.
 *
 *     const listener = Deno.listen({ port: 4505 });
 *
 *     serve(listener, (request) => {
 *       const body = `Your user-agent is:\n\n${request.headers.get(
 *         "user-agent",
 *       ) ?? "Unknown"}`;
 *
 *       return new Response(body, { status: 200 });
 *     });
 *
 * @param {Deno.Listener} listener The listener to accept connections from.
 * @param {Handler} handler The handler for individual HTTP requests.
 * @param {ServeInit} options Additional serve options.
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

  return server.serve(listener);
}

/**
 * Create a listener on the given address, accept incoming connections, and
 * handle requests on these connections with the given handler.
 *
 *     const addr = ":4505";
 *
 *     listenAndServe(addr, (request) => {
 *       const body = `Your user-agent is:\n\n${request.headers.get(
 *         "user-agent",
 *       ) ?? "Unknown"}`;
 *
 *       return new Response(body, { status: 200 });
 *     });
 *
 * @param {string} addr The TCP address to listen on.
 * @param {Handler} handler The handler for individual HTTP requests.
 * @param {ServeInit} options Additional serve options.
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

  return server.listenAndServe();
}

/**
 * Create a listener on the given address, accept incoming connections, upgrade
 * them to TLS, and handle requests on these connections with the given handler.
 *
 *     const addr = ":4505";
 *     const certFile = "/path/to/certFile.crt";
 *     const keyFile = "/path/to/keyFile.key";
 *
 *     listenAndServeTls(addr, certFile, keyFile, (request) => {
 *       const body = `Your user-agent is:\n\n${request.headers.get(
 *         "user-agent",
 *       ) ?? "Unknown"}`;
 *
 *       return new Response(body, { status: 200 });
 *     });
 *
 * @param {string} addr The TCP address to listen on.
 * @param {string} certFile The path to the file containing the TLS certificate.
 * @param {string} keyFile The path to the file containing the TLS private key.
 * @param {Handler} handler The handler for individual HTTP requests.
 * @param {ServeInit} options Additional serve options.
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

  return server.listenAndServeTls(certFile, keyFile);
}
