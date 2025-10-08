#!/usr/bin/env -S deno run --allow-net --allow-read
// Copyright 2018-2025 the Deno authors. MIT license.
import {
  serveDir as stableServeDir,
  type ServeDirOptions as StableServeDirOptions,
  serveFile as stableServeFile,
  type ServeFileOptions as StableServeFileOptions,
} from "./file_server.ts";

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
  const headers = opts.headers
    ? Array.from(opts.headers.entries()).map(([k, v]) => `${k}: ${v}`)
    : [];

  return stableServeDir(req, { ...opts, headers });
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

  /** Headers to add to each response
   *
   * @default {[]}
   */
  headers?: Headers;
}

/** Interface for serveFile options. */
export interface ServeFileOptions extends StableServeFileOptions {
  /** Headers to add to each response
   *
   * @default {[]}
   */
  headers?: Headers;
}

/**
 * Resolves a {@linkcode Response} with the requested file as the body.
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
  const response = await stableServeFile(req, filePath, options);

  for (const [name, value] of options?.headers ?? []) {
    response.headers.append(name, value);
  }

  return response;
}
