#!/usr/bin/env -S deno run --allow-net --allow-read
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

// This program serves files in the current directory over HTTP.
// TODO(bartlomieju): Add tests like these:
// https://github.com/indexzero/http-server/blob/master/test/http-server-test.js

import { extname, posix } from "../path/mod.ts";
import { serve, serveTls } from "./server.ts";
import { Status, STATUS_TEXT } from "./http_status.ts";
import { parse } from "../flags/mod.ts";
import { assert } from "../_util/assert.ts";
import { red } from "../fmt/colors.ts";

const DEFAULT_CHUNK_SIZE = 16_640;

interface EntryInfo {
  mode: string;
  size: string;
  url: string;
  name: string;
}

interface FileServerArgs {
  _: string[];
  // -p --port
  port: string;
  // --cors
  cors: boolean;
  // --no-dir-listing
  "dir-listing": boolean;
  dotfiles: boolean;
  // --host
  host: string;
  // -c --cert
  cert: string;
  // -k --key
  key: string;
  // -h --help
  help: boolean;
  // --quiet
  quiet: boolean;
}

const encoder = new TextEncoder();

const MEDIA_TYPES: Record<string, string> = {
  ".md": "text/markdown",
  ".html": "text/html",
  ".htm": "text/html",
  ".json": "application/json",
  ".map": "application/json",
  ".txt": "text/plain",
  ".ts": "text/typescript",
  ".tsx": "text/tsx",
  ".js": "application/javascript",
  ".jsx": "text/jsx",
  ".gz": "application/gzip",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".mjs": "application/javascript",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".conf": "text/plain",
  ".list": "text/plain",
  ".log": "text/plain",
  ".ini": "text/plain",
  ".vtt": "text/vtt",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".mid": "audio/midi",
  ".midi": "audio/midi",
  ".mp3": "audio/mp3",
  ".mp4a": "audio/mp4",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".spx": "audio/ogg",
  ".opus": "audio/ogg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".aac": "audio/x-aac",
  ".flac": "audio/x-flac",
  ".mp4": "video/mp4",
  ".mp4v": "video/mp4",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".tiff": "image/tiff",
  ".psd": "image/vnd.adobe.photoshop",
  ".ico": "image/vnd.microsoft.icon",
  ".webp": "image/webp",
  ".es": "application/ecmascript",
  ".epub": "application/epub+zip",
  ".jar": "application/java-archive",
  ".war": "application/java-archive",
  ".webmanifest": "application/manifest+json",
  ".doc": "application/msword",
  ".dot": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".dotx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  ".cjs": "application/node",
  ".bin": "application/octet-stream",
  ".pkg": "application/octet-stream",
  ".dump": "application/octet-stream",
  ".exe": "application/octet-stream",
  ".deploy": "application/octet-stream",
  ".img": "application/octet-stream",
  ".msi": "application/octet-stream",
  ".pdf": "application/pdf",
  ".pgp": "application/pgp-encrypted",
  ".asc": "application/pgp-signature",
  ".sig": "application/pgp-signature",
  ".ai": "application/postscript",
  ".eps": "application/postscript",
  ".ps": "application/postscript",
  ".rdf": "application/rdf+xml",
  ".rss": "application/rss+xml",
  ".rtf": "application/rtf",
  ".apk": "application/vnd.android.package-archive",
  ".key": "application/vnd.apple.keynote",
  ".numbers": "application/vnd.apple.keynote",
  ".pages": "application/vnd.apple.pages",
  ".geo": "application/vnd.dynageo",
  ".gdoc": "application/vnd.google-apps.document",
  ".gslides": "application/vnd.google-apps.presentation",
  ".gsheet": "application/vnd.google-apps.spreadsheet",
  ".kml": "application/vnd.google-earth.kml+xml",
  ".mkz": "application/vnd.google-earth.kmz",
  ".icc": "application/vnd.iccprofile",
  ".icm": "application/vnd.iccprofile",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xlm": "application/vnd.ms-excel",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pot": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".potx":
    "application/vnd.openxmlformats-officedocument.presentationml.template",
  ".xps": "application/vnd.ms-xpsdocument",
  ".odc": "application/vnd.oasis.opendocument.chart",
  ".odb": "application/vnd.oasis.opendocument.database",
  ".odf": "application/vnd.oasis.opendocument.formula",
  ".odg": "application/vnd.oasis.opendocument.graphics",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".rar": "application/vnd.rar",
  ".unityweb": "application/vnd.unity",
  ".dmg": "application/x-apple-diskimage",
  ".bz": "application/x-bzip",
  ".crx": "application/x-chrome-extension",
  ".deb": "application/x-debian-package",
  ".php": "application/x-httpd-php",
  ".iso": "application/x-iso9660-image",
  ".sh": "application/x-sh",
  ".sql": "application/x-sql",
  ".srt": "application/x-subrip",
  ".xml": "application/xml",
  ".zip": "application/zip",
};

/** Returns the content-type based on the extension of a path. */
function contentType(path: string): string | undefined {
  return MEDIA_TYPES[extname(path)];
}

// Generates a SHA-1 hash for the provided string
async function createEtagHash(message: string) {
  const byteToHex = (b: number) => b.toString(16).padStart(2, "00");
  const hashType = "SHA-1"; // Faster, and this isn't a security sensitive cryptographic use case

  // see: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
  const msgUint8 = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest(hashType, msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byteToHex).join("");
  return hashHex;
}

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
    .forEach((v): void => {
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

/**
 * Returns an HTTP Response with the requested file as the body.
 * @param req The server request context used to cleanup the file handle.
 * @param filePath Path of the file to serve.
 */
export async function serveFile(
  req: Request,
  filePath: string,
): Promise<Response> {
  const [file, fileInfo] = await Promise.all([
    Deno.open(filePath),
    Deno.stat(filePath),
  ]);

  const headers = setBaseHeaders();

  // Set mime-type using the file extension in filePath
  const contentTypeValue = contentType(filePath);
  if (contentTypeValue) {
    headers.set("content-type", contentTypeValue);
  }

  // Set date header if access timestamp is available
  if (fileInfo.atime instanceof Date) {
    const date = new Date(fileInfo.atime);
    headers.set("date", date.toUTCString());
  }

  // Set last modified header if access timestamp is available
  if (fileInfo.mtime instanceof Date) {
    const lastModified = new Date(fileInfo.mtime);
    headers.set("last-modified", lastModified.toUTCString());

    // Create a simple etag that is an md5 of the last modified date and filesize concatenated
    const simpleEtag = await createEtagHash(
      `${lastModified.toJSON()}${fileInfo.size}`,
    );
    headers.set("etag", simpleEtag);

    // If a `if-none-match` header is present and the value matches the tag or
    // if a `if-modified-since` header is present and the value is bigger than
    // the access timestamp value, then return 304
    const ifNoneMatch = req.headers.get("if-none-match");
    const ifModifiedSince = req.headers.get("if-modified-since");
    if (
      (ifNoneMatch && ifNoneMatch === simpleEtag) ||
      (ifNoneMatch === null &&
        ifModifiedSince &&
        fileInfo.mtime.getTime() < new Date(ifModifiedSince).getTime() + 1000)
    ) {
      const status = Status.NotModified;
      const statusText = STATUS_TEXT.get(status);

      file.close();

      return new Response(null, {
        status,
        statusText,
        headers,
      });
    }
  }

  // Get and parse the "range" header
  const range = req.headers.get("range") as string;
  const rangeRe = /bytes=(\d+)-(\d+)?/;
  const parsed = rangeRe.exec(range);

  // Use the parsed value if available, fallback to the start and end of the entire file
  const start = parsed && parsed[1] ? +parsed[1] : 0;
  const end = parsed && parsed[2] ? +parsed[2] : fileInfo.size - 1;

  let status = Status.OK;

  // If there is a range, set the status to 206, and set the "Content-range" header.
  if (range && parsed) {
    status = Status.PartialContent;
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
    const status = Status.RequestedRangeNotSatisfiable;
    const statusText = STATUS_TEXT.get(status);

    file.close();

    return new Response(statusText, {
      status,
      statusText,
      headers,
    });
  }

  // Set content length
  const contentLength = end - start + 1;
  headers.set("content-length", `${contentLength}`);

  // Create a stream of the file instead of loading it into memory
  let bytesSent = 0;
  const body = new ReadableStream({
    async start() {
      if (start > 0) {
        await file.seek(start, Deno.SeekMode.Start);
      }
    },
    async pull(controller) {
      const bytes = new Uint8Array(DEFAULT_CHUNK_SIZE);
      const bytesRead = await file.read(bytes);
      if (bytesRead === null) {
        file.close();
        controller.close();
        return;
      }
      controller.enqueue(
        bytes.slice(0, Math.min(bytesRead, contentLength - bytesSent)),
      );
      bytesSent += bytesRead;
      if (bytesSent > contentLength) {
        file.close();
        controller.close();
      }
    },
  });

  const statusText = STATUS_TEXT.get(status);

  return new Response(body, {
    status,
    statusText,
    headers,
  });
}

// TODO(bartlomieju): simplify this after deno.stat and deno.readDir are fixed
async function serveDirIndex(
  req: Request,
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
    const fileUrl = encodeURI(posix.join(dirUrl, entry.name));
    if (entry.name === "index.html" && entry.isFile) {
      // in case index.html as dir...
      return serveFile(req, filePath);
    }
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

  return new Response(page, { status: Status.OK, headers });
}

function serveFallback(_req: Request, e: Error): Promise<Response> {
  if (e instanceof URIError) {
    return Promise.resolve(
      new Response(STATUS_TEXT.get(Status.BadRequest), {
        status: Status.BadRequest,
      }),
    );
  } else if (e instanceof Deno.errors.NotFound) {
    return Promise.resolve(
      new Response(STATUS_TEXT.get(Status.NotFound), {
        status: Status.NotFound,
      }),
    );
  }

  return Promise.resolve(
    new Response(STATUS_TEXT.get(Status.InternalServerError), {
      status: Status.InternalServerError,
    }),
  );
}

function serverLog(req: Request, status: number): void {
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

interface ServeDirOptions {
  fsRoot?: string;
  urlRoot?: string;
  showDirListing?: boolean;
  showDotfiles?: boolean;
  enableCors?: boolean;
  quiet?: boolean;
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
 * @param request The request to handle
 * @param opts
 * @returns
 */
export async function serveDir(req: Request, opts: ServeDirOptions = {}) {
  let response: Response;
  const target = opts.fsRoot || ".";
  const urlRoot = opts.urlRoot;

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
      if (opts.showDirListing) {
        response = await serveDirIndex(req, fsPath, {
          dotfiles: opts.showDotfiles || false,
          target,
        });
      } else {
        throw new Deno.errors.NotFound();
      }
    } else {
      response = await serveFile(req, fsPath);
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error("[non-error thrown]");
    console.error(red(err.message));
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

  return response!;
}

function normalizeURL(url: string): string {
  let normalizedUrl = url;

  try {
    //allowed per https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
    const absoluteURI = new URL(normalizedUrl);
    normalizedUrl = absoluteURI.pathname;
  } catch (e) {
    //wasn't an absoluteURI
    if (!(e instanceof TypeError)) {
      throw e;
    }
  }

  try {
    normalizedUrl = decodeURI(normalizedUrl);
  } catch (e) {
    if (!(e instanceof URIError)) {
      throw e;
    }
  }

  if (normalizedUrl[0] !== "/") {
    throw new URIError("The request URI is malformed.");
  }

  normalizedUrl = posix.normalize(normalizedUrl);
  const startOfParams = normalizedUrl.indexOf("?");

  return startOfParams > -1
    ? normalizedUrl.slice(0, startOfParams)
    : normalizedUrl;
}

function main(): void {
  const serverArgs = parse(Deno.args, {
    string: ["port", "host", "cert", "key"],
    boolean: ["help", "dir-listing", "dotfiles", "cors", "quiet"],
    default: {
      "dir-listing": true,
      dotfiles: true,
      cors: true,
      quiet: false,
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
    },
  }) as FileServerArgs;
  const port = serverArgs.port;
  const host = serverArgs.host;
  const certFile = serverArgs.cert;
  const keyFile = serverArgs.key;

  if (serverArgs.help) {
    printUsage();
    Deno.exit();
  }

  if (keyFile || certFile) {
    if (keyFile === "" || certFile === "") {
      console.log("--key and --cert are required for TLS");
      printUsage();
      Deno.exit(1);
    }
  }

  const target = posix.resolve(serverArgs._[0] ?? "");

  const handler = (req: Request): Promise<Response> => {
    return serveDir(req, {
      fsRoot: target,
      showDirListing: serverArgs["dir-listing"],
      showDotfiles: serverArgs.dotfiles,
      enableCors: serverArgs.cors,
      quiet: serverArgs.quiet,
    });
  };

  const useTls = Boolean(keyFile || certFile);

  if (useTls) {
    serveTls(handler, {
      port: Number(port),
      hostname: host,
      certFile,
      keyFile,
    });
  } else {
    serve(handler, { port: Number(port), hostname: host });
  }

  const protocol = useTls ? "https" : "http";
  console.log(
    `${protocol.toUpperCase()} server listening on ${protocol}://${
      host.replace(
        "0.0.0.0",
        "localhost",
      )
    }:${port}/`,
  );
}

function printUsage() {
  console.log(`Deno File Server
  Serves a local directory in HTTP.

INSTALL:
  deno install --allow-net --allow-read https://deno.land/std/http/file_server.ts

USAGE:
  file_server [path] [options]

OPTIONS:
  -h, --help          Prints help information
  -p, --port <PORT>   Set port
  --cors              Enable CORS via the "Access-Control-Allow-Origin" header
  --host     <HOST>   Hostname (default is 0.0.0.0)
  -c, --cert <FILE>   TLS certificate file (enables TLS)
  -k, --key  <FILE>   TLS key file (enables TLS)
  --no-dir-listing    Disable directory listing
  --no-dotfiles       Do not show dotfiles
  --quiet             Do not print request level logs

  All TLS options are required when one is provided.`);
}

if (import.meta.main) {
  main();
}
