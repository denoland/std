#!/usr/bin/env -S deno run --allow-net --allow-read
// Copyright 2018-2025 the Deno authors. MIT license.
import {
  serveDir as stableServeDir,
  type ServeDirOptions as StableServeDirOptions,
} from "./file_server.ts";
// deno-lint-ignore deno-std-docs/exported-symbol-documented
export { serveFile, type ServeFileOptions } from "./file_server.ts";

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
export function serveDir(
  req: Request,
  opts: ServeDirOptions = {},
): Promise<Response> {
  return stableServeDir(req, opts);
}

/** Interface for serveDir options. */
export interface ServeDirOptions extends StableServeDirOptions {
  /**
   * Also serves `.html` files without the need for specifying the extension.
   * For example `foo.html` could be accessed through both `/foo` and `/foo.html`.
   *
   * @default {false}
   */
  cleanUrls?: boolean;
}
