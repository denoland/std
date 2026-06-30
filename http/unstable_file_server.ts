#!/usr/bin/env -S deno run --allow-net --allow-read
// Copyright 2018-2026 the Deno authors. MIT license.
import {
  serveDir as stableServeDir,
  type ServeDirOptions as StableServeDirOptions,
  serveFile as stableServeFile,
  type ServeFileOptions as StableServeFileOptions,
} from "./file_server.ts";
import { isRedirectStatus } from "./status.ts";

function appendHeaders(
  target: Headers,
  headers: HeadersInit | string[],
): void {
  // Legacy form: a flat array of `"name: value"` strings.
  if (Array.isArray(headers) && typeof headers[0] === "string") {
    for (const header of headers as string[]) {
      const i = header.indexOf(":");
      target.append(header.slice(0, i), header.slice(i + 1).trimStart());
    }
    return;
  }
  for (const [name, value] of new Headers(headers as HeadersInit)) {
    target.append(name, value);
  }
}

/**
 * Serves the files under the given directory root (opts.fsRoot).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts ignore
 * import { serveDir } from "@std/http/file-server";
 *
 * Deno.serve((req) => {
 *   const pathname = new URL(req.url).pathname;
 *   if (pathname.startsWith("/static")) {
 *     return serveDir(req, {
 *       fsRoot: "path/to/static/files/dir",
 *     });
 *   }
 *   // Do dynamic responses
 *   return new Response();
 * });
 * ```
 *
 * @example Changing the URL root
 *
 * Requests to `/static/path/to/file` will be served from `./public/path/to/file`.
 *
 * ```ts ignore
 * import { serveDir } from "@std/http/file-server";
 *
 * Deno.serve((req) => serveDir(req, {
 *   fsRoot: "public",
 *   urlRoot: "static",
 * }));
 * ```
 *
 * @param req The request to handle
 * @param opts Additional options.
 * @returns A response for the request.
 */
export async function serveDir(
  req: Request,
  opts: ServeDirOptions = {},
): Promise<Response> {
  const { headers, ...rest } = opts;
  const response = await stableServeDir(req, rest);
  if (headers && !isRedirectStatus(response.status)) {
    appendHeaders(response.headers, headers);
  }
  return response;
}

/** Interface for serveDir options. */
export interface ServeDirOptions
  extends Omit<StableServeDirOptions, "headers"> {
  /**
   * Also serves `.html` files without the need for specifying the extension.
   * For example `foo.html` could be accessed through both `/foo` and `/foo.html`.
   *
   * @default {false}
   */
  cleanUrls?: boolean;
  /** Headers to add to each response.
   *
   * Accepts any {@linkcode HeadersInit}. The legacy flat array of
   * `"name: value"` strings (e.g. `["X-Extra: extra header"]`) is also
   * still accepted.
   *
   * Values are appended to the response, not replaced, so passing a header
   * the file server already sets (e.g. `cache-control`) yields a
   * comma-joined value rather than overriding it.
   *
   * @default {[]}
   */
  headers?: HeadersInit | string[];
}

/** Interface for serveFile options. */
export interface ServeFileOptions extends StableServeFileOptions {
  /** Headers to add to each response.
   *
   * Accepts any {@linkcode HeadersInit}. The legacy flat array of
   * `"name: value"` strings (e.g. `["X-Extra: extra header"]`) is also
   * still accepted.
   *
   * Values are appended to the response, not replaced, so passing a header
   * the file server already sets (e.g. `cache-control`) yields a
   * comma-joined value rather than overriding it.
   *
   * @default {[]}
   */
  headers?: HeadersInit | string[];
}

/**
 * Resolves a {@linkcode Response} with the requested file as the body.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts ignore
 * import { serveFile } from "@std/http/file-server";
 *
 * Deno.serve((req) => {
 *   return serveFile(req, "README.md");
 * });
 * ```
 *
 * @param req The server request context used to cleanup the file handle.
 * @param filePath Path of the file to serve.
 * @param options Additional options.
 * @returns A response for the request.
 */
export async function serveFile(
  req: Request,
  filePath: string,
  options?: ServeFileOptions,
): Promise<Response> {
  const { headers, ...rest } = options ?? {};
  const response = await stableServeFile(req, filePath, rest);

  if (headers) {
    appendHeaders(response.headers, headers);
  }

  return response;
}
