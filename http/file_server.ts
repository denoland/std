#!/usr/bin/env -S deno run --allow-net --allow-read
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

// This program serves files in the current directory over HTTP.
// TODO(bartlomieju): Add tests like these:
// https://github.com/indexzero/http-server/blob/master/test/http-server-test.js

/**
 * Contains functions {@linkcode serveDir} and {@linkcode serveFile} for building a static file server.
 *
 * This module can also be used as a cli. If you want to run directly:
 *
 * ```shell
 * > # start server
 * > deno run --allow-net --allow-read https://deno.land/std@$STD_VERSION/http/file_server.ts
 * > # show help
 * > deno run --allow-net --allow-read https://deno.land/std@$STD_VERSION/http/file_server.ts --help
 * ```
 *
 * If you want to install and run:
 *
 * ```shell
 * > # install
 * > deno install --allow-net --allow-read https://deno.land/std@$STD_VERSION/http/file_server.ts
 * > # start server
 * > file_server
 * > # show help
 * > file_server --help
 * ```
 *
 * @module
 */

import { extname, posix } from "../path/mod.ts";
import { contentType } from "../media_types/content_type.ts";
import { serve, serveTls } from "./server.ts";
import { calculate, ifNoneMatch } from "./etag.ts";
import { isRedirectStatus, Status } from "./http_status.ts";
import { ByteSliceStream } from "../streams/byte_slice_stream.ts";
import { parse } from "../flags/mod.ts";
import { red } from "../fmt/colors.ts";
import { createCommonResponse } from "./util.ts";
import { VERSION } from "../version.ts";
import { format as formatBytes } from "../fmt/bytes.ts";

interface EntryInfo {
  mode: string;
  size: string;
  url: string;
  name: string;
}

const ENV_PERM_STATUS =
  Deno.permissions.querySync?.({ name: "env", variable: "DENO_DEPLOYMENT_ID" })
    .state ?? "granted"; // for deno deploy
const DENO_DEPLOYMENT_ID = ENV_PERM_STATUS === "granted"
  ? Deno.env.get("DENO_DEPLOYMENT_ID")
  : undefined;
const HASHED_DENO_DEPLOYMENT_ID = DENO_DEPLOYMENT_ID
  ? calculate(DENO_DEPLOYMENT_ID, { weak: true })
  : undefined;

function modeToString(isDir: boolean, maybeMode: number | null): string {
  const modeMap = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];

  if (maybeMode === null) {
    return "(unknown mode)";
  }
  const mode = maybeMode.toString(8);
  if (mode.length < 3) {
    return "(unknown mode)";
  }
  let output = "";
  mode
    .split("")
    .reverse()
    .slice(0, 3)
    .forEach((v) => {
      output = `${modeMap[+v]} ${output}`;
    });
  output = `${isDir ? "d" : "-"} ${output}`;
  return output;
}

/**
 * parse range header.
 *
 * ```ts ignore
 * parseRangeHeader("bytes=0-100",   500); // => { start: 0, end: 100 }
 * parseRangeHeader("bytes=0-",      500); // => { start: 0, end: 499 }
 * parseRangeHeader("bytes=-100",    500); // => { start: 400, end: 499 }
 * parseRangeHeader("bytes=invalid", 500); // => null
 * ```
 *
 * Note: Currently, no support for multiple Ranges (e.g. `bytes=0-10, 20-30`)
 */
function parseRangeHeader(rangeValue: string, fileSize: number) {
  const rangeRegex = /bytes=(?<start>\d+)?-(?<end>\d+)?$/u;
  const parsed = rangeValue.match(rangeRegex);

  if (!parsed || !parsed.groups) {
    // failed to parse range header
    return null;
  }

  const { start, end } = parsed.groups;
  if (start !== undefined) {
    if (end !== undefined) {
      return { start: +start, end: +end };
    } else {
      return { start: +start, end: fileSize - 1 };
    }
  } else {
    if (end !== undefined) {
      // example: `bytes=-100` means the last 100 bytes.
      return { start: fileSize - +end, end: fileSize - 1 };
    } else {
      // failed to parse range header
      return null;
    }
  }
}

/** Interface for serveFile options. */
export interface ServeFileOptions {
  /** The algorithm to use for generating the ETag.
   *
   * @default {"SHA-256"}
   */
  etagAlgorithm?: AlgorithmIdentifier;
  /** An optional FileInfo object returned by Deno.stat. It is used for optimization purposes. */
  fileInfo?: Deno.FileInfo;
}

/**
 * Returns an HTTP Response with the requested file as the body.
 * @param req The server request context used to cleanup the file handle.
 * @param filePath Path of the file to serve.
 */
export async function serveFile(
  req: Request,
  filePath: string,
  { etagAlgorithm: algorithm, fileInfo }: ServeFileOptions = {},
): Promise<Response> {
  try {
    fileInfo ??= await Deno.stat(filePath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await req.body?.cancel();
      return createCommonResponse(Status.NotFound);
    } else {
      throw error;
    }
  }

  if (fileInfo.isDirectory) {
    await req.body?.cancel();
    return createCommonResponse(Status.NotFound);
  }

  const headers = createBaseHeaders();

  // Set date header if access timestamp is available
  if (fileInfo.atime) {
    headers.set("date", fileInfo.atime.toUTCString());
  }

  const etag = fileInfo.mtime
    ? await calculate(fileInfo, { algorithm })
    : await HASHED_DENO_DEPLOYMENT_ID;

  // Set last modified header if last modification timestamp is available
  if (fileInfo.mtime) {
    headers.set("last-modified", fileInfo.mtime.toUTCString());
  }
  if (etag) {
    headers.set("etag", etag);
  }

  if (etag || fileInfo.mtime) {
    // If a `if-none-match` header is present and the value matches the tag or
    // if a `if-modified-since` header is present and the value is bigger than
    // the access timestamp value, then return 304
    const ifNoneMatchValue = req.headers.get("if-none-match");
    const ifModifiedSinceValue = req.headers.get("if-modified-since");
    if (
      (!ifNoneMatch(ifNoneMatchValue, etag)) ||
      (ifNoneMatchValue === null &&
        fileInfo.mtime &&
        ifModifiedSinceValue &&
        fileInfo.mtime.getTime() <
          new Date(ifModifiedSinceValue).getTime() + 1000)
    ) {
      return createCommonResponse(Status.NotModified, null, { headers });
    }
  }

  // Set mime-type using the file extension in filePath
  const contentTypeValue = contentType(extname(filePath));
  if (contentTypeValue) {
    headers.set("content-type", contentTypeValue);
  }

  const fileSize = fileInfo.size;

  const rangeValue = req.headers.get("range");

  // handle range request
  // Note: Some clients add a Range header to all requests to limit the size of the response.
  // If the file is empty, ignore the range header and respond with a 200 rather than a 416.
  // https://github.com/golang/go/blob/0d347544cbca0f42b160424f6bc2458ebcc7b3fc/src/net/http/fs.go#L273-L276
  if (rangeValue && 0 < fileSize) {
    const parsed = parseRangeHeader(rangeValue, fileSize);

    // Returns 200 OK if parsing the range header fails
    if (!parsed) {
      // Set content length
      headers.set("content-length", `${fileSize}`);

      const file = await Deno.open(filePath);
      return createCommonResponse(Status.OK, file.readable, { headers });
    }

    // Return 416 Range Not Satisfiable if invalid range header value
    if (
      parsed.end < 0 ||
      parsed.end < parsed.start ||
      fileSize <= parsed.start
    ) {
      // Set the "Content-range" header
      headers.set("content-range", `bytes */${fileSize}`);

      return createCommonResponse(
        Status.RequestedRangeNotSatisfiable,
        undefined,
        { headers },
      );
    }

    // clamps the range header value
    const start = Math.max(0, parsed.start);
    const end = Math.min(parsed.end, fileSize - 1);

    // Set the "Content-range" header
    headers.set("content-range", `bytes ${start}-${end}/${fileSize}`);

    // Set content length
    const contentLength = end - start + 1;
    headers.set("content-length", `${contentLength}`);

    // Return 206 Partial Content
    const file = await Deno.open(filePath);
    await file.seek(start, Deno.SeekMode.Start);
    const sliced = file.readable
      .pipeThrough(new ByteSliceStream(0, contentLength - 1));
    return createCommonResponse(Status.PartialContent, sliced, { headers });
  }

  // Set content length
  headers.set("content-length", `${fileSize}`);

  const file = await Deno.open(filePath);
  return createCommonResponse(Status.OK, file.readable, { headers });
}

async function serveDirIndex(
  dirPath: string,
  options: {
    showDotfiles: boolean;
    target: string;
    quiet: boolean | undefined;
  },
): Promise<Response> {
  const { showDotfiles } = options;
  const dirUrl = `/${posix.relative(options.target, dirPath)}`;
  const listEntryPromise: Promise<EntryInfo>[] = [];

  // if ".." makes sense
  if (dirUrl !== "/") {
    const prevPath = posix.join(dirPath, "..");
    const entryInfo = Deno.stat(prevPath).then((fileInfo): EntryInfo => ({
      mode: modeToString(true, fileInfo.mode),
      size: "",
      name: "../",
      url: posix.join(dirUrl, ".."),
    }));
    listEntryPromise.push(entryInfo);
  }

  // Read fileInfo in parallel
  for await (const entry of Deno.readDir(dirPath)) {
    if (!showDotfiles && entry.name[0] === ".") {
      continue;
    }
    const filePath = posix.join(dirPath, entry.name);
    const fileUrl = encodeURIComponent(posix.join(dirUrl, entry.name))
      .replaceAll("%2F", "/");

    listEntryPromise.push((async () => {
      try {
        const fileInfo = await Deno.stat(filePath);
        return {
          mode: modeToString(entry.isDirectory, fileInfo.mode),
          size: entry.isFile ? formatBytes(fileInfo.size ?? 0) : "",
          name: `${entry.name}${entry.isDirectory ? "/" : ""}`,
          url: `${fileUrl}${entry.isDirectory ? "/" : ""}`,
        };
      } catch (error) {
        // Note: Deno.stat for windows system files may be rejected with os error 32.
        if (!options.quiet) logError(error);
        return {
          mode: "(unknown mode)",
          size: "",
          name: `${entry.name}${entry.isDirectory ? "/" : ""}`,
          url: `${fileUrl}${entry.isDirectory ? "/" : ""}`,
        };
      }
    })());
  }

  const listEntry = await Promise.all(listEntryPromise);
  listEntry.sort((a, b) =>
    a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
  );
  const formattedDirUrl = `${dirUrl.replace(/\/$/, "")}/`;
  const page = dirViewerTemplate(formattedDirUrl, listEntry);

  const headers = createBaseHeaders();
  headers.set("content-type", "text/html; charset=UTF-8");

  return createCommonResponse(Status.OK, page, { headers });
}

function serveFallback(maybeError: unknown): Response {
  if (maybeError instanceof URIError) {
    return createCommonResponse(Status.BadRequest);
  }

  if (maybeError instanceof Deno.errors.NotFound) {
    return createCommonResponse(Status.NotFound);
  }

  return createCommonResponse(Status.InternalServerError);
}

function serverLog(req: Request, status: number) {
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const url = new URL(req.url);
  const s = `${dateFmt} [${req.method}] ${url.pathname}${url.search} ${status}`;
  // using console.debug instead of console.log so chrome inspect users can hide request logs
  console.debug(s);
}

function createBaseHeaders(): Headers {
  return new Headers({
    server: "deno",
    // Set "accept-ranges" so that the client knows it can make range requests on future requests
    "accept-ranges": "bytes",
  });
}

function dirViewerTemplate(dirname: string, entries: EntryInfo[]): string {
  const paths = dirname.split("/");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Deno File Server</title>
        <style>
          :root {
            --background-color: #fafafa;
            --color: rgba(0, 0, 0, 0.87);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --background-color: #292929;
              --color: #fff;
            }
            thead {
              color: #7f7f7f;
            }
          }
          @media (min-width: 960px) {
            main {
              max-width: 960px;
            }
            body {
              padding-left: 32px;
              padding-right: 32px;
            }
          }
          @media (min-width: 600px) {
            main {
              padding-left: 24px;
              padding-right: 24px;
            }
          }
          body {
            background: var(--background-color);
            color: var(--color);
            font-family: "Roboto", "Helvetica", "Arial", sans-serif;
            font-weight: 400;
            line-height: 1.43;
            font-size: 0.875rem;
          }
          a {
            color: #2196f3;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          thead {
            text-align: left;
          }
          thead th {
            padding-bottom: 12px;
          }
          table td {
            padding: 6px 36px 6px 0px;
          }
          .size {
            text-align: right;
            padding: 6px 12px 6px 24px;
          }
          .mode {
            font-family: monospace, monospace;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Index of
          <a href="/">home</a>${
    paths
      .map((path, index, array) => {
        if (path === "") return "";
        const link = array.slice(0, index + 1).join("/");
        return `<a href="${link}">${path}</a>`;
      })
      .join("/")
  }
          </h1>
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Size</th>
                <th>Name</th>
              </tr>
            </thead>
            ${
    entries
      .map(
        (entry) => `
                  <tr>
                    <td class="mode">
                      ${entry.mode}
                    </td>
                    <td class="size">
                      ${entry.size}
                    </td>
                    <td>
                      <a href="${entry.url}">${entry.name}</a>
                    </td>
                  </tr>
                `,
      )
      .join("")
  }
          </table>
        </main>
      </body>
    </html>
  `;
}

/** Interface for serveDir options. */
export interface ServeDirOptions {
  /** Serves the files under the given directory root. Defaults to your current directory.
   *
   * @default {"."}
   */
  fsRoot?: string;
  /** Specified that part is stripped from the beginning of the requested pathname.
   *
   * @default {undefined}
   */
  urlRoot?: string;
  /** Enable directory listing.
   *
   * @default {false}
   */
  showDirListing?: boolean;
  /** Serves dotfiles.
   *
   * @default {false}
   */
  showDotfiles?: boolean;
  /** Serves index.html as the index file of the directory.
   *
   * @default {true}
   */
  showIndex?: boolean;
  /** Enable CORS via the "Access-Control-Allow-Origin" header.
   *
   * @default {false}
   */
  enableCors?: boolean;
  /** Do not print request level logs. Defaults to false.
   *
   * @default {false}
   */
  quiet?: boolean;
  /** The algorithm to use for generating the ETag.
   *
   * @default {"SHA-256"}
   */
  etagAlgorithm?: AlgorithmIdentifier;
  /** Headers to add to each response
   *
   * @default {[]}
   */
  headers?: string[];
}

/**
 * Serves the files under the given directory root (opts.fsRoot).
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * import { serveDir } from "https://deno.land/std@$STD_VERSION/http/file_server.ts";
 *
 * serve((req) => {
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
 * Optionally you can pass `urlRoot` option. If it's specified that part is stripped from the beginning of the requested pathname.
 *
 * ```ts
 * import { serveDir } from "https://deno.land/std@$STD_VERSION/http/file_server.ts";
 *
 * // ...
 * serveDir(new Request("http://localhost/static/path/to/file"), {
 *   fsRoot: "public",
 *   urlRoot: "static",
 * });
 * ```
 *
 * The above example serves `./public/path/to/file` for the request to `/static/path/to/file`.
 *
 * @param req The request to handle
 */
export async function serveDir(req: Request, opts: ServeDirOptions = {}) {
  let response: Response;
  try {
    response = await createServeDirResponse(req, opts);
  } catch (error) {
    if (!opts.quiet) logError(error);
    response = serveFallback(error);
  }

  // Do not update the header if the response is a 301 redirect.
  const isRedirectResponse = isRedirectStatus(response.status);

  if (opts.enableCors && !isRedirectResponse) {
    response.headers.append("access-control-allow-origin", "*");
    response.headers.append(
      "access-control-allow-headers",
      "Origin, X-Requested-With, Content-Type, Accept, Range",
    );
  }

  if (!opts.quiet) serverLog(req, response.status);

  if (opts.headers && !isRedirectResponse) {
    for (const header of opts.headers) {
      const headerSplit = header.split(":");
      const name = headerSplit[0];
      const value = headerSplit.slice(1).join(":");
      response.headers.append(name, value);
    }
  }

  return response;
}

async function createServeDirResponse(
  req: Request,
  opts: ServeDirOptions,
) {
  const target = opts.fsRoot || ".";
  const urlRoot = opts.urlRoot;
  const showIndex = opts.showIndex ?? true;
  const showDotfiles = opts.showDotfiles || false;
  const { etagAlgorithm, showDirListing, quiet } = opts;

  const url = new URL(req.url);
  const decodedUrl = decodeURIComponent(url.pathname);
  let normalizedPath = posix.normalize(decodedUrl);

  if (urlRoot && !normalizedPath.startsWith("/" + urlRoot)) {
    return createCommonResponse(Status.NotFound);
  }

  // Redirect paths like `/foo////bar` and `/foo/bar/////` to normalized paths.
  if (normalizedPath !== decodedUrl) {
    url.pathname = normalizedPath;
    return Response.redirect(url, 301);
  }

  if (urlRoot) {
    normalizedPath = normalizedPath.replace(urlRoot, "");
  }

  // Remove trailing slashes to avoid ENOENT errors
  // when accessing a path to a file with a trailing slash.
  if (normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  const fsPath = posix.join(target, normalizedPath);
  const fileInfo = await Deno.stat(fsPath);

  // For files, remove the trailing slash from the path.
  if (fileInfo.isFile && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
    return Response.redirect(url, 301);
  }
  // For directories, the path must have a trailing slash.
  if (fileInfo.isDirectory && !url.pathname.endsWith("/")) {
    // On directory listing pages,
    // if the current URL's pathname doesn't end with a slash, any
    // relative URLs in the index file will resolve against the parent
    // directory, rather than the current directory. To prevent that, we
    // return a 301 redirect to the URL with a slash.
    url.pathname += "/";
    return Response.redirect(url, 301);
  }

  // if target is file, serve file.
  if (!fileInfo.isDirectory) {
    return serveFile(req, fsPath, {
      etagAlgorithm,
      fileInfo,
    });
  }

  // if target is directory, serve index or dir listing.
  if (showIndex) { // serve index.html
    const indexPath = posix.join(fsPath, "index.html");

    let indexFileInfo: Deno.FileInfo | undefined;
    try {
      indexFileInfo = await Deno.lstat(indexPath);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
      // skip Not Found error
    }

    if (indexFileInfo?.isFile) {
      return serveFile(req, indexPath, {
        etagAlgorithm,
        fileInfo: indexFileInfo,
      });
    }
  }

  if (showDirListing) { // serve directory list
    return serveDirIndex(fsPath, { showDotfiles, target, quiet });
  }

  return createCommonResponse(Status.NotFound);
}

function logError(error: unknown) {
  console.error(red(error instanceof Error ? error.message : `${error}`));
}

function main() {
  const serverArgs = parse(Deno.args, {
    string: ["port", "host", "cert", "key", "header"],
    boolean: ["help", "dir-listing", "dotfiles", "cors", "verbose", "version"],
    negatable: ["dir-listing", "dotfiles", "cors"],
    collect: ["header"],
    default: {
      "dir-listing": true,
      dotfiles: true,
      cors: true,
      verbose: false,
      version: false,
      host: "0.0.0.0",
      port: "4507",
      cert: "",
      key: "",
    },
    alias: {
      p: "port",
      c: "cert",
      k: "key",
      h: "help",
      v: "verbose",
      V: "version",
      H: "header",
    },
  });
  const port = Number(serverArgs.port);
  const headers = serverArgs.header || [];
  const host = serverArgs.host;
  const certFile = serverArgs.cert;
  const keyFile = serverArgs.key;

  if (serverArgs.help) {
    printUsage();
    Deno.exit();
  }

  if (serverArgs.version) {
    console.log(`Deno File Server ${VERSION}`);
    Deno.exit();
  }

  if (keyFile || certFile) {
    if (keyFile === "" || certFile === "") {
      console.log("--key and --cert are required for TLS");
      printUsage();
      Deno.exit(1);
    }
  }

  const wild = serverArgs._ as string[];
  const target = posix.resolve(wild[0] ?? "");

  const handler = (req: Request): Promise<Response> => {
    return serveDir(req, {
      fsRoot: target,
      showDirListing: serverArgs["dir-listing"],
      showDotfiles: serverArgs.dotfiles,
      enableCors: serverArgs.cors,
      quiet: !serverArgs.verbose,
      headers,
    });
  };

  const useTls = !!(keyFile && certFile);

  if (useTls) {
    serveTls(handler, {
      port,
      hostname: host,
      certFile,
      keyFile,
    });
  } else {
    serve(handler, { port, hostname: host });
  }
}

function printUsage() {
  console.log(`Deno File Server ${VERSION}
  Serves a local directory in HTTP.

INSTALL:
  deno install --allow-net --allow-read https://deno.land/std/http/file_server.ts

USAGE:
  file_server [path] [options]

OPTIONS:
  -h, --help            Prints help information
  -p, --port <PORT>     Set port
  --cors                Enable CORS via the "Access-Control-Allow-Origin" header
  --host     <HOST>     Hostname (default is 0.0.0.0)
  -c, --cert <FILE>     TLS certificate file (enables TLS)
  -k, --key  <FILE>     TLS key file (enables TLS)
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

if (import.meta.main) {
  main();
}
