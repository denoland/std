#!/usr/bin/env -S deno run --allow-net --allow-read
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

// This program serves files in the current directory over HTTP.
// TODO(bartlomieju): Add tests like these:
// https://github.com/indexzero/http-server/blob/master/test/http-server-test.js

import { extname, posix } from "../path/mod.ts";
import { contentType } from "../media_types/content_type.ts";
import { serve, serveTls } from "./server.ts";
import { Status } from "./http_status.ts";
import { parse } from "../flags/mod.ts";
import { assert } from "../_util/asserts.ts";
import { red } from "../fmt/colors.ts";
import { compareEtag, createCommonResponse } from "./util.ts";
import { DigestAlgorithm } from "../crypto/crypto.ts";
import { toHashString } from "../crypto/to_hash_string.ts";
import { createHash } from "../crypto/_util.ts";
import { VERSION } from "../version.ts";
interface EntryInfo {
  mode: string;
  size: string;
  url: string;
  name: string;
}

const encoder = new TextEncoder();

// avoid top-lebvel-await
const envPermissionStatus =
  Deno.permissions.querySync?.({ name: "env", variable: "DENO_DEPLOYMENT_ID" })
    .state ?? "granted"; // for deno deploy
const DENO_DEPLOYMENT_ID = envPermissionStatus === "granted"
  ? Deno.env.get("DENO_DEPLOYMENT_ID")
  : undefined;
const hashedDenoDeploymentId = DENO_DEPLOYMENT_ID
  ? createHash("FNV32A", DENO_DEPLOYMENT_ID).then((hash) => toHashString(hash))
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

function fileLenToString(len: number): string {
  const multiplier = 1024;
  let base = 1;
  const suffix = ["B", "K", "M", "G", "T"];
  let suffixIndex = 0;

  while (base * multiplier < len) {
    if (suffixIndex >= suffix.length - 1) {
      break;
    }
    base *= multiplier;
    suffixIndex++;
  }

  return `${(len / base).toFixed(2)}${suffix[suffixIndex]}`;
}

/** Interface for serveFile options. */
export interface ServeFileOptions {
  /** The algorithm to use for generating the ETag.
   *
   * @default {"fnv1a"}
   */
  etagAlgorithm?: DigestAlgorithm;
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
  { etagAlgorithm, fileInfo }: ServeFileOptions = {},
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

  const file = await Deno.open(filePath);

  const headers = setBaseHeaders();

  // Set mime-type using the file extension in filePath
  const contentTypeValue = contentType(extname(filePath));
  if (contentTypeValue) {
    headers.set("content-type", contentTypeValue);
  }

  // Set date header if access timestamp is available
  if (fileInfo.atime instanceof Date) {
    const date = new Date(fileInfo.atime);
    headers.set("date", date.toUTCString());
  }

  // Create a simple etag that is an md5 of the last modified date and filesize concatenated
  const etag = fileInfo.mtime
    ? toHashString(
      await createHash(
        etagAlgorithm ?? "FNV32A",
        `${fileInfo.mtime.toJSON()}${fileInfo.size}`,
      ),
    )
    : await hashedDenoDeploymentId;

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
    const ifNoneMatch = req.headers.get("if-none-match");
    const ifModifiedSince = req.headers.get("if-modified-since");
    if (
      (etag && ifNoneMatch && compareEtag(ifNoneMatch, etag)) ||
      (ifNoneMatch === null &&
        fileInfo.mtime &&
        ifModifiedSince &&
        fileInfo.mtime.getTime() < new Date(ifModifiedSince).getTime() + 1000)
    ) {
      file.close();

      return createCommonResponse(Status.NotModified, null, { headers });
    }
  }

  // Get and parse the "range" header
  const range = req.headers.get("range") as string;
  const rangeRe = /bytes=(\d+)-(\d+)?/;
  const parsed = rangeRe.exec(range);

  // Use the parsed value if available, fallback to the start and end of the entire file
  const start = parsed && parsed[1] ? +parsed[1] : 0;
  const end = parsed && parsed[2] ? +parsed[2] : fileInfo.size - 1;

  // If there is a range, set the status to 206, and set the "Content-range" header.
  if (range && parsed) {
    headers.set("content-range", `bytes ${start}-${end}/${fileInfo.size}`);
  }

  // Return 416 if `start` isn't less than or equal to `end`, or `start` or `end` are greater than the file's size
  const maxRange = fileInfo.size - 1;

  if (
    range &&
    (!parsed ||
      typeof start !== "number" ||
      start > end ||
      start > maxRange ||
      end > maxRange)
  ) {
    file.close();

    return createCommonResponse(
      Status.RequestedRangeNotSatisfiable,
      undefined,
      {
        headers,
      },
    );
  }

  // Set content length
  const contentLength = end - start + 1;
  headers.set("content-length", `${contentLength}`);
  if (range && parsed) {
    await file.seek(start, Deno.SeekMode.Start);
    return createCommonResponse(Status.PartialContent, file.readable, {
      headers,
    });
  }

  return createCommonResponse(Status.OK, file.readable, { headers });
}

// TODO(bartlomieju): simplify this after deno.stat and deno.readDir are fixed
async function serveDirIndex(
  dirPath: string,
  options: {
    dotfiles: boolean;
    target: string;
  },
): Promise<Response> {
  const showDotfiles = options.dotfiles;
  const dirUrl = `/${posix.relative(options.target, dirPath)}`;
  const listEntry: EntryInfo[] = [];

  // if ".." makes sense
  if (dirUrl !== "/") {
    const prevPath = posix.join(dirPath, "..");
    const fileInfo = await Deno.stat(prevPath);
    listEntry.push({
      mode: modeToString(true, fileInfo.mode),
      size: "",
      name: "../",
      url: posix.join(dirUrl, ".."),
    });
  }

  for await (const entry of Deno.readDir(dirPath)) {
    if (!showDotfiles && entry.name[0] === ".") {
      continue;
    }
    const filePath = posix.join(dirPath, entry.name);
    const fileUrl = encodeURIComponent(posix.join(dirUrl, entry.name))
      .replaceAll("%2F", "/");
    const fileInfo = await Deno.stat(filePath);
    listEntry.push({
      mode: modeToString(entry.isDirectory, fileInfo.mode),
      size: entry.isFile ? fileLenToString(fileInfo.size ?? 0) : "",
      name: `${entry.name}${entry.isDirectory ? "/" : ""}`,
      url: `${fileUrl}${entry.isDirectory ? "/" : ""}`,
    });
  }
  listEntry.sort((a, b) =>
    a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
  );
  const formattedDirUrl = `${dirUrl.replace(/\/$/, "")}/`;
  const page = encoder.encode(dirViewerTemplate(formattedDirUrl, listEntry));

  const headers = setBaseHeaders();
  headers.set("content-type", "text/html");

  return createCommonResponse(Status.OK, page, { headers });
}

function serveFallback(_req: Request, e: Error): Promise<Response> {
  if (e instanceof URIError) {
    return Promise.resolve(createCommonResponse(Status.BadRequest));
  } else if (e instanceof Deno.errors.NotFound) {
    return Promise.resolve(createCommonResponse(Status.NotFound));
  }

  return Promise.resolve(createCommonResponse(Status.InternalServerError));
}

function serverLog(req: Request, status: number) {
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const normalizedUrl = normalizeURL(req.url);
  const s = `${dateFmt} [${req.method}] ${normalizedUrl} ${status}`;
  // using console.debug instead of console.log so chrome inspect users can hide request logs
  console.debug(s);
}

function setBaseHeaders(): Headers {
  const headers = new Headers();
  headers.set("server", "deno");

  // Set "accept-ranges" so that the client knows it can make range requests on future requests
  headers.set("accept-ranges", "bytes");
  headers.set("date", new Date().toUTCString());

  return headers;
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
  /** Serves the files under the given directory root. Defaults to your current directory. */
  fsRoot?: string;
  /** Specified that part is stripped from the beginning of the requested pathname. */
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
  /** Serves index.html as the index file of the directory. */
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
   * @default {"fnv1a"}
   */
  etagAlgorithm?: DigestAlgorithm;
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
  let response: Response | undefined = undefined;
  const target = opts.fsRoot || ".";
  const urlRoot = opts.urlRoot;
  const showIndex = opts.showIndex ?? true;

  try {
    let normalizedPath = normalizeURL(req.url);
    if (urlRoot) {
      if (normalizedPath.startsWith("/" + urlRoot)) {
        normalizedPath = normalizedPath.replace(urlRoot, "");
      } else {
        throw new Deno.errors.NotFound();
      }
    }

    const fsPath = posix.join(target, normalizedPath);
    const fileInfo = await Deno.stat(fsPath);

    if (fileInfo.isDirectory) {
      if (showIndex) {
        try {
          const path = posix.join(fsPath, "index.html");
          const indexFileInfo = await Deno.lstat(path);
          if (indexFileInfo.isFile) {
            response = await serveFile(req, path, {
              etagAlgorithm: opts.etagAlgorithm,
              fileInfo: indexFileInfo,
            });
          }
        } catch (e) {
          if (!(e instanceof Deno.errors.NotFound)) {
            throw e;
          }
          // pass
        }
      }
      if (!response && opts.showDirListing) {
        response = await serveDirIndex(fsPath, {
          dotfiles: opts.showDotfiles || false,
          target,
        });
      }
      if (!response) {
        throw new Deno.errors.NotFound();
      }
    } else {
      response = await serveFile(req, fsPath, {
        etagAlgorithm: opts.etagAlgorithm,
        fileInfo,
      });
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error("[non-error thrown]");
    if (!opts.quiet) console.error(red(err.message));
    response = await serveFallback(req, err);
  }

  if (opts.enableCors) {
    assert(response);
    response.headers.append("access-control-allow-origin", "*");
    response.headers.append(
      "access-control-allow-headers",
      "Origin, X-Requested-With, Content-Type, Accept, Range",
    );
  }

  if (!opts.quiet) serverLog(req, response!.status);

  if (opts.headers) {
    for (const header of opts.headers) {
      const headerSplit = header.split(":");
      const name = headerSplit[0];
      const value = headerSplit.slice(1).join(":");
      response.headers.append(name, value);
    }
  }

  return response!;
}

function normalizeURL(url: string): string {
  return posix.normalize(decodeURIComponent(new URL(url).pathname));
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
