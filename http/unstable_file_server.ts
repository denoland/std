#!/usr/bin/env -S deno serve --allow-read
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * This module is a CLI for serving static files on multiple threads.
 *
 * @example Start the server
 * ```sh
 * deno serve --allow-read jsr:@std/http/unstable-file-server
 * ```
 *
 * @example Using `deno serve` arguments
 *
 * This module is executed using `deno serve`, which means you can use all the
 * arguments that are available for `deno serve` in addition to the
 * arguments that are available for this module. For `deno serve` arguments,
 * enter `deno serve --help` or check out the
 * {@link https://docs.deno.com/runtime/reference/cli/serve/#options-cert | documentation}.
 *
 * ```sh
 * deno serve --help
 * ```
 *
 * `deno serve` arguments must be passed before the module name and module
 * arguments after.
 *
 * ```sh
 * deno serve --allow-read --parallel jsr:@std/http/unstable-file-server --no-dir-listing
 * ```
 *
 * @example Disable directory listing
 *
 * By setting the `--no-dir-listing` flag.
 *
 * ```sh
 * deno serve --allow-read jsr:@std/http/unstable-file-server --no-dir-listing
 * ```
 *
 * @example Disable showing dotfiles
 *
 * By setting the `--no-dotfiles` flag.
 *
 * ```sh
 * deno serve --allow-read jsr:@std/http/unstable-file-server --no-dotfiles
 * ```
 *
 * @example Enable CORS
 *
 * By setting the `--cors` flag.
 *
 * ```sh
 * deno serve --allow-read jsr:@std/http/unstable-file-server --cors
 * ```
 *
 * @example Enable verbose mode
 *
 * By setting the `--verbose` flag.
 *
 * ```sh
 * deno serve --allow-read jsr:@std/http/unstable-file-server --verbose
 * ```
 *
 * @example Set custom headers
 *
 * By setting the `--header` flag.
 *
 * ```sh
 * deno serve --allow-read jsr:@std/http/unstable-file-server --header=Content-Type:text/plain
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import {
  serveDir,
  type ServeDirOptions,
  serveFile,
  type ServeFileOptions,
} from "./file_server.ts";
import { resolve } from "@std/path/resolve";
import { parseArgs } from "@std/cli/parse-args";
import DENO_CONFIG from "./deno.json" with { type: "json" };

export { serveDir, type ServeDirOptions, serveFile, type ServeFileOptions };

const serverArgs = parseArgs(Deno.args, {
  string: ["header"],
  boolean: ["help", "dir-listing", "dotfiles", "cors", "verbose", "version"],
  negatable: ["dir-listing", "dotfiles", "cors"],
  collect: ["header"],
  default: {
    "dir-listing": true,
    dotfiles: true,
    cors: true,
    verbose: false,
    version: false,
  },
  alias: {
    h: "help",
    v: "verbose",
    V: "version",
    H: "header",
  },
});

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

function printUsage() {
  // deno-lint-ignore no-console
  console.log(`Deno File Server ${DENO_CONFIG.version}
  Serves a local directory in HTTP.

  This module uses \`deno serve\`. Run \`deno serve --help\` for more
  information on the subcommand flags available.

USAGE:
  deno serve --allow-read [arguments] jsr:@std/http/unstable-file-server [options] [path]

ARGUMENTS:
  --help                Prints \`deno serve\` help information

OPTIONS:
  --cors                Enable CORS via the "Access-Control-Allow-Origin" header
  -H, --header <HEADER> Sets a header on every request.
                        (e.g. --header "Cache-Control: no-cache")
                        This option can be specified multiple times.
  --no-dir-listing      Disable directory listing
  --no-dotfiles         Do not show dotfiles
  --no-cors             Disable cross-origin resource sharing
  -v, --verbose         Print request level logs
  -V, --version         Print version information

  All TLS options are required when one is provided.`);
}

function main() {
  if (serverArgs.help) {
    printUsage();
    Deno.exit(0);
  }

  if (serverArgs.version) {
    // deno-lint-ignore no-console
    console.log(`Deno File Server ${DENO_CONFIG.version}`);
    Deno.exit();
  }
}

if (import.meta.main) {
  main();
}

export default {
  fetch: handler,
} as Deno.ServeDefaultExport;
