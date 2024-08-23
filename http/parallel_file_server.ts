#!/usr/bin/env -S deno serve --allow-read
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * This module is a CLI for serving static files.
 *
 * @example Start the server
 * ```sh
 * deno serve --allow-read --parallel jsr:@std/http/parallel-file-server
 * ```
 *
 * @example Get help with `deno serve`
 *
 * By using the `--help` flag.
 *
 * ```sh
 * deno serve --help
 * ```
 *
 * @example Define port and hostname to listen on
 *
 * By setting the `--port` and `--hostname` flags.
 *
 * ```sh
 * deno serve --allow-read --parallel --port=8080 --hostname=1.2.3.4 jsr:@std/http/parallel-file-server
 * ```
 *
 * @example Enable TLS
 *
 * By setting the `--cert` and `--key` flags.
 *
 * ```sh
 * deno serve --allow-read --parallel --cert=cert.pem --key=key.pem jsr:@std/http/parallel-file-server
 * ```
 *
 * @example Disable directory listing
 *
 * By setting the `--no-dir-listing` flag.
 *
 * ```sh
 * deno serve --allow-read --parallel --no-dir-listing jsr:@std/http/parallel-file-server
 * ```
 *
 * @example Disable showing dotfiles
 *
 * By setting the `--no-dotfiles` flag.
 *
 * ```sh
 * deno serve --allow-read --parallel --no-dotfiles jsr:@std/http/parallel-file-server
 * ```
 *
 * @example Enable CORS
 *
 * By setting the `--cors` flag.
 *
 * ```sh
 * deno serve --allow-read --parallel --cors jsr:@std/http/parallel-file-server
 * ```
 *
 * @example Enable verbose mode
 *
 * By setting the `--verbose` flag.
 *
 * ```sh
 * deno serve --allow-read --parallel --verbose jsr:@std/http/parallel-file-server
 * ```
 *
 * @example Set custom headers
 *
 * By setting the `--header` flag.
 *
 * ```sh
 * deno serve --allow-read --parallel --header=Content-Type:text/plain jsr:@std/http/parallel-file-server
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import { serveDir } from "./file_server.ts";
import { getServerArgs } from "./_file_server_utils.ts";
import { resolve } from "@std/path/resolve";

const serverArgs = getServerArgs();

const headers = serverArgs.header || [];
const wild = serverArgs._ as string[];
const target = resolve(wild[0] ?? "");

function handler(req: Request): Promise<Response> {
  return serveDir(req, {
    fsRoot: target,
    showDirListing: serverArgs["dir-listing"],
    showDotfiles: serverArgs.dotfiles,
    enableCors: serverArgs.cors,
    quiet: !serverArgs.verbose,
    headers,
  });
}

export default {
  fetch: handler,
} as Deno.ServeDefaultExport;
