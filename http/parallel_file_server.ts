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
