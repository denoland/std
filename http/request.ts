import { ConnInfo } from "./server.ts";
import { Expand } from "../_util/types.ts";

/**
 * An incoming request. Follows the Request web standard, adding connection
 * information, a mutable request context and some helpers for common use cases.
 *
 * @typeParam C - Type of the current request `context` */
export class HttpRequest<C extends {} = {}> implements Request {
  #context: C;
  #parsedUrl?: URL = undefined;

  /**
   * Wraps a request, adding connection information and request context to it.
   *
   * @param request The incoming `Request` to wrap
   * @param connInfo Connection information about the connection `request` was received on
   * @param context Initial request context, set to `{}` for empty context
   */
  constructor(
    private request: Request,
    readonly connInfo: ConnInfo,
    context: C,
  ) {
    this.#context = context;
  }

  /**
   * Current request context. Can be used to attach arbitrary request specific
   * information e.g. in middleware.
   */
  get context(): C {
    return this.#context;
  }

  /**
   * Add information to the request context. The passed object will be merged
   * with the current request context.
   *
   * Example:
   *
   * ```ts
   * declare const req: HttpRequest
   *
   * const reqWithUser = req.addContext({ user: "Example" })
   * assertEquals(reqWithUser.context.user, "Example")
   * ```
   */
  addContext<N extends {}>(contextToAdd: N): HttpRequest<Expand<C & N>> {
    this.#context = { ...this.#context, ...contextToAdd };

    //@ts-ignore Limitations of mutation and types, but we should mutate for performance
    return this as HttpRequest<C & N>;
  }

  /** `URL` object representation of this request's url */
  get parsedUrl(): URL {
    return this.#parsedUrl ??
      (this.#parsedUrl = new URL(this.url));
  }
  /* *********************
  *  * Request Delegates *
  *  ********************* */

  get cache() {
    return this.request.cache;
  }

  get credentials() {
    return this.request.credentials;
  }

  get destination() {
    return this.request.destination;
  }

  get headers() {
    return this.request.headers;
  }

  get integrity() {
    return this.request.integrity;
  }

  get isHistoryNavigation() {
    return this.request.isHistoryNavigation;
  }

  get isReloadNavigation() {
    return this.request.isReloadNavigation;
  }

  get keepalive() {
    return this.request.keepalive;
  }

  get method() {
    return this.request.method;
  }

  get mode() {
    return this.request.mode;
  }

  get redirect() {
    return this.request.redirect;
  }

  get referrer() {
    return this.request.referrer;
  }

  get referrerPolicy() {
    return this.request.referrerPolicy;
  }

  get signal() {
    return this.request.signal;
  }

  get url() {
    return this.request.url;
  }

  get body() {
    return this.request.body;
  }

  get bodyUsed() {
    return this.request.bodyUsed;
  }

  arrayBuffer() {
    return this.request.arrayBuffer();
  }

  blob() {
    return this.request.blob();
  }

  formData() {
    return this.request.formData();
  }

  json() {
    return this.request.json();
  }

  text() {
    return this.request.text();
  }

  clone() {
    return new HttpRequest<C>(
      this.request.clone(),
      this.connInfo,
      this.context,
    );
  }
}
