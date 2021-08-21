// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { _parseAddrFromStr } from "./server.ts";

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
 *
 * If the handler throws, the server calling the handler will assume the impact
 * of the error is isolated to the individual request. It will catch the error
 * and close the underlying connection.
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
   * "host:port". If not provided, ":80" is used by default for HTTP and ":443"
   * is used by default for HTTPS.
   */
  addr?: string;

  /**
   * The handler for individual HTTP requests.
   */
  handler: Handler;
}

export class Server {
  #addr?: string;
  #handler: Handler;
  #closed = false;
  #listeners: Set<Deno.Listener> = new Set();
  #httpConnections: Set<Deno.HttpConn> = new Set();

  /**
   * Constructs a new Server instance.
   *
   *     const addr = ":4505";
   *     const handler = (request) => {
   *       const body = `Your user-agent is:\n\n${request.headers.get(
   *         "user-agent",
   *       ) ?? "Unknown"}`;
   *
   *       return new Response(body, { status: 200 });
   *     });
   *     const server = new Server({ addr, handler });
   *
   * @param {ServerInit} options Options for running a server.
   */
  constructor({ addr, handler }: ServerInit) {
    this.#addr = addr;
    this.#handler = handler;
  }

  /**
   * Accept incoming connections on the given listener, and handle requests on
   * these connections with the given handler.
   *
   * Throws a server closed error if called after the server has been closed.
   *
   * Will always close the listener.
   *
   *     const listener = Deno.listen({ port: 4505 });
   *     server.serve(listener);
   *
   * @param {Deno.Listener} listener The listener to accept connections from.
   * @throws {Deno.errors.Http} When the server has already been closed.
   */
  async serve(listener: Deno.Listener): Promise<void> {
    if (this.#closed) {
      throw ERROR_SERVER_CLOSED;
    }

    this.#trackListener(listener);

    try {
      return await this.#accept(listener);
    } finally {
      this.#untrackListener(listener);

      try {
        listener.close();
      } catch {
        // Listener has been closed.
      }
    }
  }

  /**
   * Create a listener on the server, accept incoming connections, and handle
   * requests on these connections with the given handler.
   *
   * Throws a server closed error if the server has been closed.
   *
   *     server.listenAndServe();
   *
   * @throws {Deno.errors.Http} When the server has already been closed.
   */
  async listenAndServe(): Promise<void> {
    if (this.#closed) {
      throw ERROR_SERVER_CLOSED;
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
   * Throws a server closed error if the server has been closed.
   *
   *     const certFile = "/path/to/certFile.crt";
   *     const keyFile = "/path/to/keyFile.key";
   *     server.listenAndServeTls(certFile, keyFile);
   *
   * @param {string} certFile The path to the file containing the TLS certificate.
   * @param {string} keyFile The path to the file containing the TLS private key.
   * @throws {Deno.errors.Http} When the server has already been closed.
   */
  async listenAndServeTls(certFile: string, keyFile: string): Promise<void> {
    if (this.#closed) {
      throw ERROR_SERVER_CLOSED;
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
      throw ERROR_SERVER_CLOSED;
    }

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
   * Serves all HTTP requests on a single TCP connection.
   *
   * @param {Deno.HttpConn} httpConn The HTTP connection to yield requests from.
   * @param {Deno.Conn} conn The TCP connection.
   * @private
   */
  async #serveHttp(
    httpConn: Deno.HttpConn,
    conn: Deno.Conn,
  ): Promise<void> {
    let requestEvent: Deno.RequestEvent | null = null;

    while (!this.#closed) {
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

      // Handle the request event, generating a response.
      let response: Response;
      try {
        response = await this.#handler(
          serverRequest.request,
          serverRequest.connInfo,
        );
      } catch {
        // If the handler throws then it is assumed that the impact of the
        // error is isolated to the individual request, so we close the
        // connection.
        break;
      }

      // Send the response.
      serverRequest.respondWith(response);

      try {
        // Wait for the request to be processed before we accept a new request
        // on this connection.
        await serverRequest.done;
      } catch {
        // Connection has been closed.
        break;
      }

      requestEvent = null;
    }

    this.#untrackHttpConnection(httpConn);

    try {
      httpConn.close();
    } catch (error) {
      if (!(error instanceof Deno.errors.BadResource)) {
        throw error;
      }
    }

    if (requestEvent) {
      try {
        // If we break the request event loop to close the connection due to an
        // error (e.g. handler throws) before we respond to the request event
        // we will leave a "responseSender" resource open. In order to ensure
        // we clean up this resource we send an empty response to the request
        // event with the expectation that it should throw a BadResource error
        // as the connection has been closed.
        await requestEvent.respondWith(new Response());
      } catch (error) {
        if (!(error instanceof Deno.errors.BadResource)) {
          throw error;
        }
      }
    }
  }

  /**
   * Accepts all TCP connections on a single network listener.
   *
   * @param {Deno.Listener} listener The listener to accept connections from.
   * @private
   */
  async #accept(
    listener: Deno.Listener,
  ): Promise<void> {
    while (!this.#closed) {
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
          continue;
        }

        throw error;
      }

      // "Upgrade" the network connection into an HTTP connection.
      const httpConn = Deno.serveHttp(conn);

      // Closing the underlying listener will not close HTTP connections, so we
      // track for closure upon server close.
      this.#trackHttpConnection(httpConn);

      // Serve the requests that arrive on the just-accepted connection. Note
      // we do not await this async method to allow the server to accept new
      // connections.
      this.#serveHttp(httpConn, conn);
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

  return await server.serve(listener);
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

  return await server.listenAndServe();
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

  return await server.listenAndServeTls(certFile, keyFile);
}
