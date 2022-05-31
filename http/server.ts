// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { delay } from "../async/mod.ts";

/** Thrown by Server after it has been closed. */
const ERROR_SERVER_CLOSED = "Server closed";

/** Default port for serving HTTP. */
const HTTP_PORT = 80;

/** Default port for serving HTTPS. */
const HTTPS_PORT = 443;

/** Initial backoff delay of 5ms following a temporary accept failure. */
const INITIAL_ACCEPT_BACKOFF_DELAY = 5;

/** Max backoff delay of 1s following a temporary accept failure. */
const MAX_ACCEPT_BACKOFF_DELAY = 1000;

/** Information about the connection a request arrived on. */
export interface ConnInfo {
  /** The local address of the connection. */
  readonly localAddr: Deno.Addr;
  /** The remote address of the connection. */
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

/** Options for running an HTTP server. */
export interface ServerInit extends Partial<Deno.ListenOptions> {
  /** The handler to invoke for individual HTTP requests. */
  handler: Handler;

  /**
   * The handler to invoke when route handlers throw an error.
   *
   * The default error handler logs and returns the error in JSON format.
   */
  onError?: (error: unknown) => Response | Promise<Response>;
}

/** Used to construct an HTTP server. */
export class Server {
  #port?: number;
  #host?: string;
  #handler: Handler;
  #closed = false;
  #listeners: Set<Deno.Listener> = new Set();
  #httpConnections: Set<Deno.HttpConn> = new Set();
  #onError: (error: unknown) => Response | Promise<Response>;

  /**
   * Constructs a new HTTP Server instance.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const port = 4505;
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ port, handler });
   * ```
   *
   * @param serverInit Options for running an HTTP server.
   */
  constructor(serverInit: ServerInit) {
    this.#port = serverInit.port;
    this.#host = serverInit.hostname;
    this.#handler = serverInit.handler;
    this.#onError = serverInit.onError ??
      function (error: unknown) {
        console.error(error);
        return new Response("Internal Server Error", { status: 500 });
      };
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
   * console.log("server listening on http://localhost:4505");
   *
   * await server.serve(listener);
   * ```
   *
   * @param listener The listener to accept connections from.
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
   * If the server was constructed without a specified port, 80 is used.
   *
   * If the server was constructed with the hostname omitted from the options, the
   * non-routable meta-address `0.0.0.0` is used.
   *
   * Throws a server closed error if the server has been closed.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const port = 4505;
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ port, handler });
   *
   * console.log("server listening on http://localhost:4505");
   *
   * await server.listenAndServe();
   * ```
   */
  async listenAndServe(): Promise<void> {
    if (this.#closed) {
      throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
    }

    const listener = Deno.listen({
      port: this.#port ?? HTTP_PORT,
      hostname: this.#host ?? "0.0.0.0",
      transport: "tcp",
    });

    return await this.serve(listener);
  }

  /**
   * Create a listener on the server, accept incoming connections, upgrade them
   * to TLS, and handle requests on these connections with the given handler.
   *
   * If the server was constructed without a specified port, 443 is used.
   *
   * If the server was constructed with the hostname omitted from the options, the
   * non-routable meta-address `0.0.0.0` is used.
   *
   * Throws a server closed error if the server has been closed.
   *
   * ```ts
   * import { Server } from "https://deno.land/std@$STD_VERSION/http/server.ts";
   *
   * const port = 4505;
   * const handler = (request: Request) => {
   *   const body = `Your user-agent is:\n\n${request.headers.get(
   *    "user-agent",
   *   ) ?? "Unknown"}`;
   *
   *   return new Response(body, { status: 200 });
   * };
   *
   * const server = new Server({ port, handler });
   *
   * const certFile = "/path/to/certFile.crt";
   * const keyFile = "/path/to/keyFile.key";
   *
   * console.log("server listening on https://localhost:4505");
   *
   * await server.listenAndServeTls(certFile, keyFile);
   * ```
   *
   * @param certFile The path to the file containing the TLS certificate.
   * @param keyFile The path to the file containing the TLS private key.
   */
  async listenAndServeTls(certFile: string, keyFile: string): Promise<void> {
    if (this.#closed) {
      throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
    }

    const listener = Deno.listenTls({
      port: this.#port ?? HTTPS_PORT,
      hostname: this.#host ?? "0.0.0.0",
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

  /** Get whether the server is closed. */
  get closed(): boolean {
    return this.#closed;
  }

  /** Get the list of network addresses the server is listening on. */
  get addrs(): Deno.Addr[] {
    return Array.from(this.#listeners).map((listener) => listener.addr);
  }

  /**
   * Responds to an HTTP request.
   *
   * @param requestEvent The HTTP request to respond to.
   * @param httpCon The HTTP connection to yield requests from.
   * @param connInfo Information about the underlying connection.
   */
  async #respond(
    requestEvent: Deno.RequestEvent,
    httpConn: Deno.HttpConn,
    connInfo: ConnInfo,
  ): Promise<void> {
    let response: Response;
    try {
      // Handle the request event, generating a response.
      response = await this.#handler(requestEvent.request, connInfo);
    } catch (error: unknown) {
      // Invoke onError handler when request handler throws.
      response = await this.#onError(error);
    }

    try {
      // Send the response.
      await requestEvent.respondWith(response);
    } catch {
      // respondWith() fails when the connection has already been closed, or there is some
      // other error with responding on this connection that prompts us to
      // close it and open a new connection.
      return this.#closeHttpConn(httpConn);
    }
  }

  /**
   * Serves all HTTP requests on a single connection.
   *
   * @param httpConn The HTTP connection to yield requests from.
   * @param connInfo Information about the underlying connection.
   */
  async #serveHttp(httpConn: Deno.HttpConn, connInfo: ConnInfo): Promise<void> {
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
   * @param listener The listener to accept connections from.
   */
  async #accept(listener: Deno.Listener): Promise<void> {
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
   * @param httpConn The HTTP connection to close.
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
   * @param listener Listener to track.
   */
  #trackListener(listener: Deno.Listener): void {
    this.#listeners.add(listener);
  }

  /**
   * Removes the listener from the internal tracking list.
   *
   * @param listener Listener to untrack.
   */
  #untrackListener(listener: Deno.Listener): void {
    this.#listeners.delete(listener);
  }

  /**
   * Adds the HTTP connection to the internal tracking list.
   *
   * @param httpConn HTTP connection to track.
   */
  #trackHttpConnection(httpConn: Deno.HttpConn): void {
    this.#httpConnections.add(httpConn);
  }

  /**
   * Removes the HTTP connection from the internal tracking list.
   *
   * @param httpConn HTTP connection to untrack.
   */
  #untrackHttpConnection(httpConn: Deno.HttpConn): void {
    this.#httpConnections.delete(httpConn);
  }
}

/** Additional serve options. */
export interface ServeInit extends Partial<Deno.ListenOptions> {
  /** An AbortSignal to close the server and all connections. */
  signal?: AbortSignal;

  /** The handler to invoke when route handlers throw an error. */
  onError?: (error: unknown) => Response | Promise<Response>;

  /** The callback which is called when the server started listening */
  onListen?: (params: { hostname: string; port: number }) => void;
}

/**
 * Constructs a server, accepts incoming connections on the given listener, and
 * handles requests on these connections with the given handler.
 *
 * ```ts
 * import { serveListener } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const listener = Deno.listen({ port: 4505 });
 *
 * console.log("server listening on http://localhost:4505");
 *
 * await serveListener(listener, (request) => {
 *   const body = `Your user-agent is:\n\n${request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   return new Response(body, { status: 200 });
 * });
 * ```
 *
 * @param listener The listener to accept connections from.
 * @param handler The handler for individual HTTP requests.
 * @param options Optional serve options.
 */
export async function serveListener(
  listener: Deno.Listener,
  handler: Handler,
  options?: Omit<ServeInit, "port" | "hostname">,
): Promise<void> {
  const server = new Server({ handler, onError: options?.onError });

  options?.signal?.addEventListener("abort", () => server.close(), {
    once: true,
  });

  return await server.serve(listener);
}

function hostnameForDisplay(hostname: string) {
  // If the hostname is "0.0.0.0", we display "localhost" in console
  // because browsers in Windows don't resolve "0.0.0.0".
  // See the discussion in https://github.com/denoland/deno_std/issues/1165
  return hostname === "0.0.0.0" ? "localhost" : hostname;
}

/** Serves HTTP requests with the given handler.
 *
 * You can specify an object with a port and hostname option, which is the
 * address to listen on. The default is port 8000 on hostname "0.0.0.0".
 *
 * The below example serves with the port 8000.
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * serve((_req) => new Response("Hello, world"));
 * ```
 *
 * You can change the listening address by the `hostname` and `port` options.
 * The below example serves with the port 3000.
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * serve((_req) => new Response("Hello, world"), { port: 3000 });
 * ```
 *
 * `serve` function prints the message `Listening on http://<hostname>:<port>/`
 * on start-up by default. If you like to change this message, you can specify
 * `onListen` option to override it.
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * serve((_req) => new Response("Hello, world"), {
 *   onListen({ port, hostname }) {
 *     console.log(`Server started at http://${hostname}:${port}`);
 *     // ... more info specific to your server ..
 *   },
 * });
 * ```
 *
 * You can also specify `undefined` or `null` to stop the logging behavior.
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * serve((_req) => new Response("Hello, world"), { onListen: undefined });
 * ```
 *
 * @param handler The handler for individual HTTP requests.
 * @param options The options. See `ServeInit` documentation for details.
 */
export async function serve(
  handler: Handler,
  options: ServeInit = {},
): Promise<void> {
  const port = options.port ?? 8000;
  const hostname = options.hostname ?? "0.0.0.0";
  const server = new Server({
    port,
    hostname,
    handler,
    onError: options.onError,
  });

  options?.signal?.addEventListener("abort", () => server.close(), {
    once: true,
  });

  const s = server.listenAndServe();

  if ("onListen" in options) {
    options.onListen?.({ port, hostname });
  } else {
    console.log(`Listening on http://${hostnameForDisplay(hostname)}:${port}/`);
  }

  return await s;
}

export interface ServeTlsInit extends ServeInit {
  /** The path to the file containing the TLS private key. */
  keyFile: string;

  /** The path to the file containing the TLS certificate */
  certFile: string;
}

/** Serves HTTPS requests with the given handler.
 *
 * You must specify `keyFile` and `certFile` options.
 *
 * You can specify an object with a port and hostname option, which is the
 * address to listen on. The default is port 8443 on hostname "0.0.0.0".
 *
 * The below example serves with the default port 8443.
 *
 * ```ts
 * import { serveTls } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * const certFile = "/path/to/certFile.crt";
 * const keyFile = "/path/to/keyFile.key";
 * serveTls((_req) => new Response("Hello, world"), { certFile, keyFile });
 * ```
 *
 * `serveTls` function prints the message `Listening on https://<hostname>:<port>/`
 * on start-up by default. If you like to change this message, you can specify
 * `onListen` option to override it.
 *
 * ```ts
 * import { serveTls } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * const certFile = "/path/to/certFile.crt";
 * const keyFile = "/path/to/keyFile.key";
 * serveTls((_req) => new Response("Hello, world"), {
 *   certFile,
 *   keyFile,
 *   onListen({ port, hostname }) {
 *     console.log(`Server started at https://${hostname}:${port}`);
 *     // ... more info specific to your server ..
 *   },
 * });
 * ```
 *
 * You can also specify `undefined` or `null` to stop the logging behavior.
 *
 * ```ts
 * import { serveTls } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * const certFile = "/path/to/certFile.crt";
 * const keyFile = "/path/to/keyFile.key";
 * serveTls((_req) => new Response("Hello, world"), {
 *   certFile,
 *   keyFile,
 *   onListen: undefined,
 * });
 * ```
 *
 * @param handler The handler for individual HTTPS requests.
 * @param options The options. See `ServeTlsInit` documentation for details.
 * @returns
 */
export async function serveTls(
  handler: Handler,
  options: ServeTlsInit,
): Promise<void> {
  if (!options.keyFile) {
    throw new Error("TLS config is given, but 'keyFile' is missing.");
  }

  if (!options.certFile) {
    throw new Error("TLS config is given, but 'certFile' is missing.");
  }

  const port = options.port ?? 8443;
  const hostname = options.hostname ?? "0.0.0.0";
  const server = new Server({
    port,
    hostname,
    handler,
    onError: options.onError,
  });

  options?.signal?.addEventListener("abort", () => server.close(), {
    once: true,
  });

  const s = server.listenAndServeTls(options.certFile, options.keyFile);

  if ("onListen" in options) {
    options.onListen?.({ port, hostname });
  } else {
    console.log(
      `Listening on https://${hostnameForDisplay(hostname)}:${port}/`,
    );
  }

  return await s;
}

/**
 * @deprecated Use `serve` instead.
 *
 * Constructs a server, creates a listener on the given address, accepts
 * incoming connections, and handles requests on these connections with the
 * given handler.
 *
 * If the port is omitted from the ListenOptions, 80 is used.
 *
 * If the host is omitted from the ListenOptions, the non-routable meta-address
 * `0.0.0.0` is used.
 *
 * ```ts
 * import { listenAndServe } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const port = 4505;
 *
 * console.log("server listening on http://localhost:4505");
 *
 * await listenAndServe({ port }, (request) => {
 *   const body = `Your user-agent is:\n\n${request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   return new Response(body, { status: 200 });
 * });
 * ```
 *
 * @param config The Deno.ListenOptions to specify the hostname and port.
 * @param handler The handler for individual HTTP requests.
 * @param options Optional serve options.
 */
export async function listenAndServe(
  config: Partial<Deno.ListenOptions>,
  handler: Handler,
  options?: ServeInit,
): Promise<void> {
  const server = new Server({ ...config, handler });

  options?.signal?.addEventListener("abort", () => server.close(), {
    once: true,
  });

  return await server.listenAndServe();
}

/**
 * @deprecated Use `serveTls` instead.
 *
 * Constructs a server, creates a listener on the given address, accepts
 * incoming connections, upgrades them to TLS, and handles requests on these
 * connections with the given handler.
 *
 * If the port is omitted from the ListenOptions, port 443 is used.
 *
 * If the host is omitted from the ListenOptions, the non-routable meta-address
 * `0.0.0.0` is used.
 *
 * ```ts
 * import { listenAndServeTls } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 *
 * const port = 4505;
 * const certFile = "/path/to/certFile.crt";
 * const keyFile = "/path/to/keyFile.key";
 *
 * console.log("server listening on http://localhost:4505");
 *
 * await listenAndServeTls({ port }, certFile, keyFile, (request) => {
 *   const body = `Your user-agent is:\n\n${request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   return new Response(body, { status: 200 });
 * });
 * ```
 *
 * @param config The Deno.ListenOptions to specify the hostname and port.
 * @param certFile The path to the file containing the TLS certificate.
 * @param keyFile The path to the file containing the TLS private key.
 * @param handler The handler for individual HTTP requests.
 * @param options Optional serve options.
 */
export async function listenAndServeTls(
  config: Partial<Deno.ListenOptions>,
  certFile: string,
  keyFile: string,
  handler: Handler,
  options?: ServeInit,
): Promise<void> {
  const server = new Server({ ...config, handler });

  options?.signal?.addEventListener("abort", () => server.close(), {
    once: true,
  });

  return await server.listenAndServeTls(certFile, keyFile);
}
