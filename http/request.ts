import { ConnInfo } from "./server.ts";
import { Expand } from "../_util/types.ts";

export class HttpRequest<C extends {} = {}> implements Request {
  #context: C;
  #parsedUrl?: URL = undefined;

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

  addContext<N extends {}>(contextToAdd: N): HttpRequest<Expand<C & N>> {
    this.#context = { ...this.#context, ...contextToAdd };

    //@ts-ignore Limitations of mutation and types, but we should mutate for performance
    return this as HttpRequest<C & N>;
  }

  get parsedUrl(): URL {
    return this.#parsedUrl ??
      (this.#parsedUrl = new URL(this.url));
  }
  /* *********************
  *  * Request Delegates *
  *  ********************* */

  get cache(): RequestCache {
    return this.request.cache;
  }

  get credentials(): RequestCredentials {
    return this.request.credentials;
  }

  get destination(): RequestDestination {
    return this.request.destination;
  }

  get headers(): Headers {
    return this.request.headers;
  }

  get integrity(): string {
    return this.request.integrity;
  }

  get isHistoryNavigation(): boolean {
    return this.request.isHistoryNavigation;
  }

  get isReloadNavigation(): boolean {
    return this.request.isReloadNavigation;
  }

  get keepalive(): boolean {
    return this.request.keepalive;
  }

  get method(): string {
    return this.request.method;
  }

  get mode(): RequestMode {
    return this.request.mode;
  }

  get redirect(): RequestRedirect {
    return this.request.redirect;
  }

  get referrer(): string {
    return this.request.referrer;
  }

  get referrerPolicy(): ReferrerPolicy {
    return this.request.referrerPolicy;
  }

  get signal(): AbortSignal {
    return this.request.signal;
  }

  get url(): string {
    return this.request.url;
  }

  get body(): ReadableStream<Uint8Array> | null {
    return this.request.body;
  }

  get bodyUsed(): boolean {
    return this.request.bodyUsed;
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return this.request.arrayBuffer();
  }

  blob(): Promise<Blob> {
    return this.request.blob();
  }

  formData(): Promise<FormData> {
    return this.request.formData();
  }

  json(): Promise<any> {
    return this.request.json();
  }

  text(): Promise<string> {
    return this.request.text();
  }

  clone(): Request {
    return this.request.clone();
  }
}
