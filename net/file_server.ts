#!/usr/bin/env deno --allow-net

// This program serves files in the current directory over HTTP.
// TODO Stream responses instead of reading them into memory.
// TODO Add tests like these:
// https://github.com/indexzero/http-server/blob/master/test/http-server-test.js

import {
  listenAndServe,
  ServerRequest,
  setContentLength,
  Response
} from "./http.ts";
import { cwd, DenoError, ErrorKind, args, stat, readDir, open } from "deno";
import { extname } from "https://deno.land/x/path/index.ts";

// based on https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
const extensionsMap = new Map([
  // default for unrecognized extensions
  ["", "application/octet-stream"],
  [".aac", "audio/aac"],
  [".abw", "application/x-abiword"],
  [".arc", "application/octet-stream"],
  [".avi", "video/x-msvideo"],
  [".azw", "application/vnd.amazon.ebook"],
  [".bin", "application/octet-stream"],
  [".bmp", "image/bmp"],
  [".bz", "application/x-bzip"],
  [".bz", "application/x-bzip2"],
  [".csh", "application/x-csh"],
  [".css", "text/css"],
  [".csv", "text/csv"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".eot", "application/vnd.ms-fontobject"],
  [".epub", "application/epub+zip"],
  [".es", "application/ecmascript"],
  [".gif", "image/gif"],
  [".htm", "text/html"],
  [".html", "text/html"],
  [".ico", "image/x-icon"],
  [".ics", "text/calendar"],
  [".jar", "application/java-archive"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "application/javascript"],
  [".json", "application/json"],
  [".mid", "audio/x-midi"],
  [".midi", "audio/x-midi"],
  [".mpeg", "video/mpeg"],
  [".mpkg", "application/vnd.apple.installer+xml"],
  [".odp", "application/vnd.oasis.opendocument.presentation"],
  [".ods", "application/vnd.oasis.opendocument.spreadsheet"],
  [".odt", "application/vnd.oasis.opendocument.text"],
  [".oga", "audio/ogg"],
  [".ogv", "video/ogg"],
  [".ogx", "application/ogg"],
  [".otf", "font/otf"],
  [".png", "image/png"],
  [".pdf", "application/pdf"],
  [".ppt", "application/vnd.ms-powerpoint"],
  [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  [".rar", "application/x-rar-compressed"],
  [".rtf", "application/rtf"],
  [".sh", "application/x-sh"],
  [".svg", "image/svg+xml"],
  [".swf", "application/x-shockwave-flash"],
  [".tar", "application/x-tar"],
  [".tif", "image/tiff"],
  [".tiff", "image/tiff"],
  [".ts", "application/typescript"],
  [".ttf", "font/ttf"],
  [".txt", "text/plain"],
  [".vsd", "application/vnd.visio"],
  [".wav", "audio/wav"],
  [".weba", "audio/webm"],
  [".webm", "video/webm"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff", "font/woff2"],
  [".xhtml", "application/xhtml+xml"],
  [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".xml", "application/xml"],
  [".xul", "application/vnd.mozilla.xul+xml"],
  [".yml", "text/yaml"],
  [".yaml", "text/yaml"],
  [".zip", "application/zip"],
]);

const dirViewerTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Deno File Server</title>
  <style>
    td {
      padding: 0 1rem;
    }
    td.mode {
      font-family: Courier;
    }
  </style>
</head>
<body>
  <h1>Index of <%DIRNAME%></h1>
  <table>
    <tr><th>Mode</th><th>Size</th><th>Name</th></tr>
    <%CONTENTS%>
  </table>
</body>
</html>
`;

const serverArgs = args.slice();
let CORSEnabled = false;
// TODO: switch to flags if we later want to add more options
for (let i = 0; i < serverArgs.length; i++) {
  if (serverArgs[i] === "--cors") {
    CORSEnabled = true;
    serverArgs.splice(i, 1);
    break;
  }
}
let currentDir = cwd();
const target = serverArgs[1];
if (target) {
  currentDir = `${currentDir}/${target}`;
}
const addr = `0.0.0.0:${serverArgs[2] || 4500}`;
const encoder = new TextEncoder();

function modeToString(isDir: boolean, maybeMode: number | null) {
  const modeMap = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];

  if (maybeMode === null) {
    return "(unknown mode)";
  }
  const mode = maybeMode!.toString(8);
  if (mode.length < 3) {
    return "(unknown mode)";
  }
  let output = "";
  mode
    .split("")
    .reverse()
    .slice(0, 3)
    .forEach(v => {
      output = modeMap[+v] + output;
    });
  output = `(${isDir ? "d" : "-"}${output})`;
  return output;
}

function fileLenToString(len: number) {
  const multipler = 1024;
  let base = 1;
  const suffix = ["B", "K", "M", "G", "T"];
  let suffixIndex = 0;

  while (base * multipler < len) {
    if (suffixIndex >= suffix.length - 1) {
      break;
    }
    base *= multipler;
    suffixIndex++;
  }

  return `${(len / base).toFixed(2)}${suffix[suffixIndex]}`;
}

function createDirEntryDisplay(
  name: string,
  path: string,
  size: number | null,
  mode: number | null,
  isDir: boolean
) {
  const sizeStr = size === null ? "" : "" + fileLenToString(size!);
  return `
  <tr><td class="mode">${modeToString(
    isDir,
    mode
  )}</td><td>${sizeStr}</td><td><a href="${path}">${name}${
    isDir ? "/" : ""
  }</a></td>
  </tr>
  `;
}

// TODO: simplify this after deno.stat and deno.readDir are fixed
async function serveDir(req: ServerRequest, dirPath: string, dirName: string) {
  // dirname has no prefix
  const listEntry: string[] = [];
  const fileInfos = await readDir(dirPath);
  for (const info of fileInfos) {
    if (info.name === "index.html" && info.isFile()) {
      // in case index.html as dir...
      return await serveFile(req, info.path);
    }
    // Yuck!
    let mode = null;
    try {
      mode = (await stat(info.path)).mode;
    } catch (e) {}
    listEntry.push(
      createDirEntryDisplay(
        info.name,
        dirName + "/" + info.name,
        info.isFile() ? info.len : null,
        mode,
        info.isDirectory()
      )
    );
  }

  const page = new TextEncoder().encode(
    dirViewerTemplate
      .replace("<%DIRNAME%>", dirName + "/")
      .replace("<%CONTENTS%>", listEntry.join(""))
  );

  const headers = new Headers();
  headers.set("content-type", "text/html");

  const res = {
    status: 200,
    body: page,
    headers
  };
  setContentLength(res);
  return res;
}

function guessContentType(filename: string): string {
  let extension = extname(filename);

  if (extensionsMap.has(extension)) {
    return extensionsMap.get(extension);
  }

  extension = extension.toLowerCase();

  if (extensionsMap.has(extension)) {
    return extensionsMap.get(extension);
  }

  return extensionsMap.get('');
}

async function serveFile(req: ServerRequest, filename: string) {
  const file = await open(filename);
  const fileInfo = await stat(filename);
  const headers = new Headers();
  headers.set("content-length", fileInfo.len.toString());
  headers.set("content-type", guessContentType(filename));

  const res = {
    status: 200,
    body: file,
    headers
  };
  return res;
}

async function serveFallback(req: ServerRequest, e: Error) {
  if (
    e instanceof DenoError &&
    (e as DenoError<any>).kind === ErrorKind.NotFound
  ) {
    return {
      status: 404,
      body: encoder.encode("Not found")
    };
  } else {
    return {
      status: 500,
      body: encoder.encode("Internal server error")
    };
  }
}

function serverLog(req: ServerRequest, res: Response) {
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const s = `${dateFmt} "${req.method} ${req.url} ${req.proto}" ${res.status}`;
  console.log(s);
}

function setCORS(res: Response) {
  if (!res.headers) {
    res.headers = new Headers();
  }
  res.headers!.append("access-control-allow-origin", "*");
  res.headers!.append(
    "access-control-allow-headers",
    "Origin, X-Requested-With, Content-Type, Accept, Range"
  );
}

listenAndServe(addr, async req => {
  const fileName = req.url.replace(/\/$/, "");
  const filePath = currentDir + fileName;

  let response: Response;

  try {
    const fileInfo = await stat(filePath);
    if (fileInfo.isDirectory()) {
      // Bug with deno.stat: name and path not populated
      // Yuck!
      response = await serveDir(req, filePath, fileName);
    } else {
      response = await serveFile(req, filePath);
    }
  } catch (e) {
    response = await serveFallback(req, e);
  } finally {
    if (CORSEnabled) {
      setCORS(response);
    }
    serverLog(req, response);
    req.respond(response);
  }
});

console.log(`HTTP server listening on http://${addr}/`);
