import { ConnInfo } from "./server.ts";

export class HttpRequest<C extends {} = {}> implements Request {
  #context: C;

  constructor(
    private request: Request,
    readonly connInfo: ConnInfo,
    context: C,
  ) {
    this.#context = context;
  }

  get context(): C {
    return this.#context;
  }

  addContext<N extends {}>(contextToAdd: N): HttpRequest<C & N> {
    this.#context = { ...this.#context, ...contextToAdd };

    //@ts-ignore Limitations of mutation and types, but we should mutate for performance
    return this as HttpRequest<C & N>;
  }
  /**
   * Returns the cache mode associated with request, which is a string
   * indicating how the request will interact with the browser's cache when
   * fetching.
   */
  get cache(): RequestCache {
    return this.request.cache;
  }
  /**
   * Returns the credentials mode associated with request, which is a string
   * indicating whether credentials will be sent with the request always, never,
   * or only when sent to a same-origin URL.
   */
  get credentials(): RequestCredentials {
    return this.request.credentials;
  }
  /**
   * Returns the kind of resource requested by request, e.g., "document" or "script".
   */
  get destination(): RequestDestination {
    return this.request.destination;
  }
  /**
   * Returns a Headers object consisting of the headers associated with request.
   * Note that headers added in the network layer by the user agent will not be
   * accounted for in this object, e.g., the "Host" header.
   */
  get headers(): Headers {
    return this.request.headers;
  }
  /**
   * Returns request's subresource integrity metadata, which is a cryptographic
   * hash of the resource being fetched. Its value consists of multiple hashes
   * separated by whitespace. [SRI]
   */
  get integrity(): string {
    return this.request.integrity;
  }
  /**
   * Returns a boolean indicating whether or not request is for a history
   * navigation (a.k.a. back-forward navigation).
   */
  get isHistoryNavigation(): boolean {
    return this.request.isHistoryNavigation;
  }
  /**
   * Returns a boolean indicating whether or not request is for a reload
   * navigation.
   */
  get isReloadNavigation(): boolean {
    return this.request.isReloadNavigation;
  }
  /**
   * Returns a boolean indicating whether or not request can outlive the global
   * in which it was created.
   */
  get keepalive(): boolean {
    return this.request.keepalive;
  }
  /**
   * Returns request's HTTP method, which is "GET" by default.
   */
  get method(): string {
    return this.request.method;
  }
  /**
   * Returns the mode associated with request, which is a string indicating
   * whether the request will use CORS, or will be restricted to same-origin
   * URLs.
   */
  get mode(): RequestMode {
    return this.request.mode;
  }
  /**
   * Returns the redirect mode associated with request, which is a string
   * indicating how redirects for the request will be handled during fetching. A
   * request will follow redirects by default.
   */
  get redirect(): RequestRedirect {
    return this.request.redirect;
  }
  /**
   * Returns the referrer of request. Its value can be a same-origin URL if
   * explicitly set in init, the empty string to indicate no referrer, and
   * "about:client" when defaulting to the global's default. This is used during
   * fetching to determine the value of the `Referer` header of the request
   * being made.
   */
  get referrer(): string {
    return this.request.referrer;
  }
  /**
   * Returns the referrer policy associated with request. This is used during
   * fetching to compute the value of the request's referrer.
   */
  get referrerPolicy(): ReferrerPolicy {
    return this.request.referrerPolicy;
  }
  /**
   * Returns the signal associated with request, which is an AbortSignal object
   * indicating whether or not request has been aborted, and its abort event
   * handler.
   */
  get signal(): AbortSignal {
    return this.request.signal;
  }
  /**
   * Returns the URL of request as a string.
   */
  get url(): string {
    return this.request.url;
  }

  /** A simple getter used to expose a `ReadableStream` of the body contents. */
  get body(): ReadableStream<Uint8Array> | null {
    return this.request.body;
  }
  /** Stores a `Boolean` that declares whether the body has been used in a
   * response yet.
   */
  get bodyUsed(): boolean {
    return this.request.bodyUsed;
  }
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with an `ArrayBuffer`.
   */
  arrayBuffer(): Promise<ArrayBuffer> {
    return this.request.arrayBuffer();
  }
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `Blob`.
   */
  blob(): Promise<Blob> {
    return this.request.blob();
  }
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `FormData` object.
   */
  formData(): Promise<FormData> {
    return this.request.formData();
  }
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with the result of parsing the body text as JSON.
   */
  json(): Promise<any> {
    return this.request.json();
  }
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `USVString` (text).
   */
  text(): Promise<string> {
    return this.request.text();
  }
  clone(): Request {
    return this.request.clone();
  }
}
