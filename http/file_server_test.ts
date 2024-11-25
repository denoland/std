// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertFalse,
  assertMatch,
  assertStringIncludes,
} from "@std/assert";
import { stub } from "@std/testing/mock";
import { serveDir, type ServeDirOptions, serveFile } from "./file_server.ts";
import { eTag } from "./etag.ts";
import {
  basename,
  dirname,
  fromFileUrl,
  join,
  resolve,
  toFileUrl,
} from "@std/path";
import denoConfig from "./deno.json" with { type: "json" };
import { MINUTE } from "@std/datetime/constants";
import { getAvailablePort } from "@std/net/get-available-port";
import { concat } from "@std/bytes/concat";
import { lessThan, parse as parseSemver } from "@std/semver";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");
const serveDirOptions: ServeDirOptions = {
  quiet: true,
  fsRoot: testdataDir,
  showDirListing: true,
  showDotfiles: true,
  enableCors: true,
};
const denoVersion = parseSemver(Deno.version.deno);
const isCanary = denoVersion.build ? denoVersion.build.length > 0 : false;
// FileInfo.mode is not available on Windows before Deno 2.1.0
const fsModeUnavailable = Deno.build.os === "windows" &&
  lessThan(denoVersion, parseSemver("2.1.0")) && !isCanary;

const TEST_FILE_PATH = join(testdataDir, "test_file.txt");
const TEST_FILE_STAT = await Deno.stat(TEST_FILE_PATH);
const TEST_FILE_SIZE = TEST_FILE_STAT.size;
const TEST_FILE_ETAG = await eTag(TEST_FILE_STAT) as string;
const TEST_FILE_LAST_MODIFIED = TEST_FILE_STAT.mtime instanceof Date
  ? new Date(TEST_FILE_STAT.mtime).toUTCString()
  : "";
const TEST_FILE_TEXT = await Deno.readTextFile(TEST_FILE_PATH);
const LOCALHOST = Deno.build.os === "windows" ? "localhost" : "0.0.0.0";

/* HTTP GET request allowing arbitrary paths */
async function fetchExactPath(
  hostname: string,
  port: number,
  path: string,
): Promise<Response> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const conn = await Deno.connect({ hostname, port });
  await conn.write(encoder.encode("GET " + path + " HTTP/1.1\r\n\r\n"));
  let currentResult = "";
  let contentLength = -1;
  let startOfBody = -1;
  for await (const chunk of conn.readable) {
    currentResult += decoder.decode(chunk);
    if (contentLength === -1) {
      const match = /^content-length: (.*)$/m.exec(currentResult);
      if (match && match[1]) {
        contentLength = Number(match[1]);
      }
    }
    if (startOfBody === -1) {
      const ind = currentResult.indexOf("\r\n\r\n");
      if (ind !== -1) {
        startOfBody = ind + 4;
      }
    }
    if (startOfBody !== -1 && contentLength !== -1) {
      const byteLen = encoder.encode(currentResult).length;
      if (byteLen >= contentLength + startOfBody) {
        break;
      }
    }
  }
  const status = /^HTTP\/1.1 (...)/.exec(currentResult);
  let statusCode = 0;
  if (status && status[1]) {
    statusCode = Number(status[1]);
  }

  const body = currentResult.slice(startOfBody);
  const headersStr = currentResult.slice(0, startOfBody);
  const headersReg = /^(.*): (.*)$/mg;
  const headersObj: { [i: string]: string } = {};
  let match = headersReg.exec(headersStr);
  while (match !== null) {
    if (match[1] && match[2]) {
      headersObj[match[1]] = match[2];
    }
    match = headersReg.exec(headersStr);
  }
  return new Response(body, {
    status: statusCode,
    headers: new Headers(headersObj),
  });
}

Deno.test("serveDir() sets last-modified header", async () => {
  const req = new Request("http://localhost/test_file.txt");
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();
  const lastModifiedHeader = res.headers.get("last-modified") as string;
  const lastModifiedTime = Date.parse(lastModifiedHeader);
  const expectedTime = TEST_FILE_STAT.mtime instanceof Date
    ? TEST_FILE_STAT.mtime.getTime()
    : Number.NaN;

  assertAlmostEquals(lastModifiedTime, expectedTime, 5 * MINUTE);
});

Deno.test("serveDir() sets date header", async () => {
  const req = new Request("http://localhost/test_file.txt");
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();
  const dateHeader = res.headers.get("date") as string;
  const date = Date.parse(dateHeader);
  const expectedTime =
    TEST_FILE_STAT.atime && TEST_FILE_STAT.atime instanceof Date
      ? TEST_FILE_STAT.atime.getTime()
      : Number.NaN;

  assertAlmostEquals(date, expectedTime, 5 * MINUTE);
});

Deno.test("serveDir()", async () => {
  const req = new Request("http://localhost/hello.html");
  const res = await serveDir(req, serveDirOptions);
  const downloadedFile = await res.text();
  const localFile = await Deno.readTextFile(join(testdataDir, "hello.html"));

  assertEquals(res.status, 200);
  assertEquals(downloadedFile, localFile);
  assertEquals(res.headers.get("content-type"), "text/html; charset=UTF-8");
});

Deno.test("serveDir() with hash symbol in filename", async () => {
  const filePath = join(testdataDir, "file#2.txt");
  const text = "Plain text";
  await Deno.writeTextFile(filePath, text);

  const req = new Request("http://localhost/file%232.txt");
  const res = await serveDir(req, serveDirOptions);
  const downloadedFile = await res.text();

  assertEquals(res.status, 200);
  assertEquals(
    res.headers.get("content-type"),
    "text/plain; charset=UTF-8",
  );
  assertEquals(downloadedFile, text);

  await Deno.remove(filePath);
});

Deno.test("serveDir() with space in filename", async () => {
  const filePath = join(testdataDir, "test file.txt");
  const text = "Plain text";
  await Deno.writeTextFile(filePath, text);

  const req = new Request("http://localhost/test%20file.txt");
  const res = await serveDir(req, serveDirOptions);
  const downloadedFile = await res.text();

  assertEquals(res.status, 200);
  assertEquals(
    res.headers.get("content-type"),
    "text/plain; charset=UTF-8",
  );
  assertEquals(downloadedFile, text);

  await Deno.remove(filePath);
});

Deno.test("serveDir() serves directory index", async () => {
  const filePath = join(testdataDir, "%25A.txt");
  await Deno.writeTextFile(filePath, "25A");

  const req = new Request("http://localhost/");
  const res = await serveDir(req, serveDirOptions);
  const page = await res.text();

  assertEquals(res.status, 200);
  assertStringIncludes(page, '<a href="/hello.html">hello.html</a>');
  assertStringIncludes(page, '<a href="/tls/">tls/</a>');
  assertStringIncludes(page, "%2525A.txt");
  if (fsModeUnavailable) {
    assertMatch(page, /<td class="mode">(\s)*\(unknown mode\)(\s)*<\/td>/);
  } else {
    assertMatch(page, /<td class="mode">(\s)*[a-zA-Z- ]{14}(\s)*<\/td>/);
  }

  await Deno.remove(filePath);
});

Deno.test("serveDir() serves directory index with file containing space in the filename", async () => {
  const filePath = join(testdataDir, "test file.txt");
  await Deno.writeTextFile(filePath, "25A");

  const req = new Request("http://localhost/");
  const res = await serveDir(req, serveDirOptions);
  const page = await res.text();

  assertEquals(res.status, 200);
  assertStringIncludes(page, '<a href="/hello.html">hello.html</a>');
  assertStringIncludes(page, '<a href="/tls/">tls/</a>');
  assertStringIncludes(page, "test%20file.txt");
  if (fsModeUnavailable) {
    assertMatch(page, /<td class="mode">(\s)*\(unknown mode\)(\s)*<\/td>/);
  } else {
    assertMatch(page, /<td class="mode">(\s)*[a-zA-Z- ]{14}(\s)*<\/td>/);
  }

  await Deno.remove(filePath);
});

Deno.test("serveDir() serves directory index with file's mode is 0", async () => {
  const stat = Deno.stat;
  using _stub = stub(
    Deno,
    "stat",
    async (path: string | URL): Promise<Deno.FileInfo> => ({
      ...(await stat(path)),
      mode: 0,
    }),
  );
  const res = await serveDir(new Request("http://localhost/"), serveDirOptions);
  const page = await res.text();
  assertMatch(page, /<td class="mode">(\s)*- --- --- ---(\s)*<\/td>/);
});

Deno.test("serveDir() escapes file names when rendering directory index", {
  ignore: Deno.build.os === "windows",
}, async () => {
  const dir = await Deno.makeTempDir();
  const filePath = join(dir, "<img src=x onerror=alert(1)>");
  await Deno.writeTextFile(filePath, "abc");
  const res = await serveDir(new Request("http://localhost/"), {
    ...serveDirOptions,
    fsRoot: dir,
  });
  assertStringIncludes(
    await res.text(),
    '<a href="/%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E">&lt;img src=x onerror=alert(1)&gt;</a>',
  );
});

Deno.test("serveDir() returns a response even if fileinfo is inaccessible", async () => {
  // Note: Deno.stat for windows system files may be rejected with os error 32.
  // Mock Deno.stat to test that the dirlisting page can be generated
  // even if the fileInfo for a particular file cannot be obtained.

  // Assuming that fileInfo of `test_file.txt` cannot be accessible
  using denoStatStub = stub(Deno, "stat", (path): Promise<Deno.FileInfo> => {
    if (path.toString().includes("test_file.txt")) {
      return Promise.reject(new Error("__stubed_error__"));
    }
    return denoStatStub.original.call(Deno, path);
  });
  const req = new Request("http://localhost/");
  const res = await serveDir(req, serveDirOptions);
  const page = await res.text();

  assertEquals(res.status, 200);
  assertStringIncludes(page, "/test_file.txt");
});

Deno.test("serveDir() handles not found files", async () => {
  const req = new Request("http://localhost/badfile.txt");
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.status, 404);
});

Deno.test("serveDir() handles incorrect method", async () => {
  const req = new Request("http://localhost/", { method: "POST" });
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.status, 405);
  assertEquals(res.statusText, "Method Not Allowed");
});

Deno.test("serveDir() traverses path correctly", async () => {
  const req = new Request("http://localhost/../../../../../../../..");
  const res = await serveDir(req, serveDirOptions);
  const page = await res.text();

  assertEquals(res.status, 200);
  assertStringIncludes(page, "hello.html");
});

Deno.test("serveDir() traverses path", async () => {
  const controller = new AbortController();
  const port = 4507;
  const server = Deno.serve(
    { port, signal: controller.signal },
    async (req) => await serveDir(req, serveDirOptions),
  );

  const res1 = await fetchExactPath("127.0.0.1", port, "../../../..");
  await res1.body?.cancel();

  assertEquals(res1.status, 400);

  const res2 = await fetchExactPath(
    "127.0.0.1",
    port,
    "http://localhost/../../../..",
  );
  const page = await res2.text();

  assertEquals(res2.status, 200);
  assertStringIncludes(page, "hello.html");

  controller.abort();
  await server.finished;
});

Deno.test("serveDir() traverses encoded URI path", async () => {
  const req = new Request(
    "http://localhost/%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2F..",
  );
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.status, 301);
  assertEquals(res.headers.get("location"), "http://localhost/");
});

Deno.test("serveDir() serves unusual filename", async () => {
  const filePath = join(testdataDir, "%");
  using _file = await Deno.create(filePath);

  const req1 = new Request("http://localhost/%25");
  const res1 = await serveDir(req1, serveDirOptions);
  await res1.body?.cancel();

  assertEquals(res1.status, 200);
  assert(res1.headers.has("access-control-allow-origin"));
  assert(res1.headers.has("access-control-allow-headers"));

  const req2 = new Request("http://localhost/test_file.txt");
  const res2 = await serveDir(req2, serveDirOptions);
  await res2.body?.cancel();

  assertEquals(res2.status, 200);
  assert(res2.headers.has("access-control-allow-origin"));
  assert(res2.headers.has("access-control-allow-headers"));

  await Deno.remove(filePath);
});

Deno.test("serveDir() supports CORS", async () => {
  const req1 = new Request("http://localhost/");
  const res1 = await serveDir(req1, serveDirOptions);
  await res1.body?.cancel();

  assertEquals(res1.status, 200);
  assert(res1.headers.has("access-control-allow-origin"));
  assert(res1.headers.has("access-control-allow-headers"));

  const req2 = new Request("http://localhost/hello.html");
  const res2 = await serveDir(req2, serveDirOptions);
  await res2.body?.cancel();

  assertEquals(res2.status, 200);
  assert(res2.headers.has("access-control-allow-origin"));
  assert(res2.headers.has("access-control-allow-headers"));
});

Deno.test("serveDir() script prints help", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "--no-lock",
      "http/file_server.ts",
      "--help",
    ],
  });
  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);
  assert(output.includes(`Deno File Server ${denoConfig.version}`));
});

Deno.test("serveDir() script prints version", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "--no-lock",
      "http/file_server.ts",
      "--version",
    ],
  });
  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);
  assert(output.includes(`Deno File Server ${denoConfig.version}`));
});

Deno.test("serveDir() ignores query params", async () => {
  const req = new Request("http://localhost/hello.html?key=value");
  const res = await serveDir(req, serveDirOptions);
  const downloadedFile = await res.text();
  const localFile = await Deno.readTextFile(join(testdataDir, "hello.html"));

  assertEquals(res.status, 200);
  assertEquals(downloadedFile, localFile);
});

Deno.test("serveDir() script fails with partial TLS args", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "--allow-read",
      "--allow-net",
      "--no-lock",
      "http/file_server.ts",
      ".",
      "--host",
      "localhost",
      "--cert",
      "./testdata/tls/localhost.crt",
      "-p",
      `4578`,
    ],
    stderr: "null",
  });
  const { stdout, success } = await command.output();
  assertFalse(success);
  assertStringIncludes(
    new TextDecoder().decode(stdout),
    "--key and --cert are required for TLS",
  );
});

Deno.test("serveDir() doesn't show directory listings", async () => {
  const req = new Request("http://localhost/");
  const res = await serveDir(req, {
    ...serveDirOptions,
    showDirListing: false,
  });
  await res.body?.cancel();

  assertEquals(res.status, 404);
});

Deno.test("serveDir() shows dotfiles when showDotfiles=true", async () => {
  const req1 = new Request("http://localhost/");
  const res1 = await serveDir(req1, serveDirOptions);
  const page1 = await res1.text();

  assert(page1.includes(".dotfile"));

  const req2 = new Request("http://localhost/.dotfile");
  const res2 = await serveDir(req2, serveDirOptions);
  const body = await res2.text();

  assertEquals(body, "dotfile");
});

Deno.test("serveDir() doesn't show dotfiles when showDotfiles=false", async () => {
  const req1 = new Request("http://localhost/");
  const res1 = await serveDir(req1, {
    ...serveDirOptions,
    showDotfiles: false,
  });
  const page1 = await res1.text();

  assert(!page1.includes(".dotfile"));

  const req2 = new Request("http://localhost/.dotfile");
  const res2 = await serveDir(req2, {
    ...serveDirOptions,
    showDotfiles: false,
  });
  const body = await res2.text();

  assertEquals(res2.status, 404);
  assertEquals(body, "Not Found");
});

Deno.test("serveDir() shows .. if it makes sense", async () => {
  const req1 = new Request("http://localhost/");
  const res1 = await serveDir(req1, serveDirOptions);
  const page1 = await res1.text();

  assert(!page1.includes("../"));
  assertStringIncludes(page1, "tls/");

  const req2 = new Request("http://localhost/tls/");
  const res2 = await serveDir(req2, serveDirOptions);
  const page2 = await res2.text();

  assertStringIncludes(page2, "../");
});

Deno.test("serveDir() handles range request (bytes=0-0)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=0-0" },
  });
  const res = await serveDir(req, serveDirOptions);
  const text = await res.text();

  assertEquals(text, "L");
});

Deno.test("serveDir() handles range request (bytes=0-100)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=0-100" },
  });
  const res = await serveDir(req, serveDirOptions);

  assertEquals(
    res.headers.get("content-range"),
    `bytes 0-100/${TEST_FILE_SIZE}`,
  );
  assertEquals(res.status, 206);
  assertEquals((await res.arrayBuffer()).byteLength, 101);
});

Deno.test("serveDir() handles range request (bytes=300-)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=300-" },
  });
  const res = await serveDir(req, serveDirOptions);
  const text = await res.text();

  assertEquals(
    res.headers.get("content-range"),
    `bytes 300-${TEST_FILE_SIZE - 1}/${TEST_FILE_SIZE}`,
  );
  assertEquals(text, TEST_FILE_TEXT.substring(300));
});

Deno.test("serveDir() handles range request (bytes=-200)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=-200" },
  });
  const res = await serveDir(req, serveDirOptions);

  assertEquals(await res.text(), TEST_FILE_TEXT.slice(-200));
  assertEquals(
    res.headers.get("content-range"),
    `bytes ${TEST_FILE_SIZE - 200}-${TEST_FILE_SIZE - 1}/${TEST_FILE_SIZE}`,
  );
  assertEquals(res.status, 206);
  assertEquals(res.statusText, "Partial Content");
});

Deno.test("serveDir() clamps ranges that are too large (bytes=0-999999999)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=0-999999999" },
  });
  const res = await serveDir(req, serveDirOptions);

  assertEquals(await res.text(), TEST_FILE_TEXT);
  assertEquals(
    res.headers.get("content-range"),
    `bytes 0-${TEST_FILE_SIZE - 1}/${TEST_FILE_SIZE}`,
  );
  assertEquals(res.status, 206);
  assertEquals(res.statusText, "Partial Content");
});

Deno.test("serveDir() clamps ranges that are too large (bytes=-999999999)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    // This means the last 999999999 bytes. It is too big and should be clamped.
    headers: { range: "bytes=-999999999" },
  });
  const res = await serveDir(req, serveDirOptions);

  assertEquals(await res.text(), TEST_FILE_TEXT);
  assertEquals(
    res.headers.get("content-range"),
    `bytes 0-${TEST_FILE_SIZE - 1}/${TEST_FILE_SIZE}`,
  );
  assertEquals(res.status, 206);
  assertEquals(res.statusText, "Partial Content");
});

Deno.test("serveDir() handles bad range request (bytes=500-200)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=500-200" },
  });
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.headers.get("content-range"), `bytes */${TEST_FILE_SIZE}`);
  assertEquals(res.status, 416);
  assertEquals(res.statusText, "Range Not Satisfiable");
});

Deno.test("serveDir() handles bad range request (bytes=99999-999999)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=99999-999999" },
  });
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.headers.get("content-range"), `bytes */${TEST_FILE_SIZE}`);
  assertEquals(res.status, 416);
  assertEquals(res.statusText, "Range Not Satisfiable");
});

Deno.test("serveDir() handles bad range request (bytes=99999)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=99999-" },
  });
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.headers.get("content-range"), `bytes */${TEST_FILE_SIZE}`);
  assertEquals(res.status, 416);
  assertEquals(res.statusText, "Range Not Satisfiable");
});

Deno.test("serveDir() ignores bad range request (bytes=100)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=100" },
  });
  const res = await serveDir(req, serveDirOptions);
  const text = await res.text();

  assertEquals(text, TEST_FILE_TEXT);
  assertEquals(res.status, 200);
  assertEquals(res.statusText, "OK");
});

Deno.test("serveDir() ignores bad range request (bytes=a-b)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=a-b" },
  });
  const res = await serveDir(req, serveDirOptions);
  const text = await res.text();

  assertEquals(text, TEST_FILE_TEXT);
  assertEquals(res.status, 200);
  assertEquals(res.statusText, "OK");
});

Deno.test("serveDir() ignores bad multi-range request (bytes=0-10, 20-30)", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { range: "bytes=0-10, 20-30" },
  });
  const res = await serveDir(req, serveDirOptions);
  const text = await res.text();

  assertEquals(text, TEST_FILE_TEXT);
  assertEquals(res.status, 200);
  assertEquals(res.statusText, "OK");
});

Deno.test("serveFile() serves ok response for empty file range request", async () => {
  const req = new Request("http://localhost/test_empty_file.txt", {
    headers: { range: "bytes=0-10, 20-30" },
  });
  const res = await serveDir(req, serveDirOptions);
  const text = await res.text();

  assertEquals(text, "");
  assertEquals(res.status, 200);
  assertEquals(res.statusText, "OK");
});

Deno.test("serveDir() sets accept-ranges header to bytes for directory listing", async () => {
  const req = new Request("http://localhost/");
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.headers.get("accept-ranges"), "bytes");
});

Deno.test("serveDir() sets accept-ranges header to bytes for file response", async () => {
  const req = new Request("http://localhost/test_file.txt");
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.headers.get("accept-ranges"), "bytes");
});

Deno.test("serveDir() sets headers if provided as arguments", async () => {
  const req = new Request("http://localhost/test_file.txt");
  const res = await serveDir(req, {
    ...serveDirOptions,
    headers: ["cache-control:max-age=100", "x-custom-header:hi"],
  });
  await res.body?.cancel();

  assertEquals(res.headers.get("cache-control"), "max-age=100");
  assertEquals(res.headers.get("x-custom-header"), "hi");
});

Deno.test("serveDir() sets etag header", async () => {
  const req = new Request("http://localhost/test_file.txt");
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.headers.get("etag"), TEST_FILE_ETAG);
});

Deno.test("serveDir() serves empty HTTP 304 response for if-none-match request of unmodified file", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { "if-none-match": TEST_FILE_ETAG },
  });
  const res = await serveDir(req, serveDirOptions);

  assertEquals(await res.text(), "");
  assertEquals(res.status, 304);
  assertEquals(res.statusText, "Not Modified");
});

Deno.test("serveDir() serves HTTP 304 response for if-modified-since request of unmodified file", async () => {
  const req = new Request("http://localhost/test_file.txt", {
    headers: { "if-modified-since": TEST_FILE_LAST_MODIFIED },
  });
  const res = await serveDir(req, serveDirOptions);
  await res.body?.cancel();

  assertEquals(res.status, 304);
  assertEquals(res.statusText, "Not Modified");
});

/**
 * When used in combination with If-None-Match, If-Modified-Since is ignored.
 * If etag doesn't match, don't return 304 even if if-modified-since is a valid
 * value.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since}
 */
Deno.test(
  "serveDir() only uses if-none-match header if if-non-match and if-modified-since headers are provided",
  async () => {
    const req = new Request("http://localhost/test_file.txt", {
      headers: {
        "if-none-match": "not match etag",
        "if-modified-since": TEST_FILE_LAST_MODIFIED,
      },
    });
    const res = await serveDir(req, serveDirOptions);
    await res.body?.cancel();

    assertEquals(res.status, 200);
    assertEquals(res.statusText, "OK");
  },
);

Deno.test("serveFile() serves test file", async () => {
  const req = new Request("http://localhost/testdata/test_file.txt");
  const res = await serveFile(req, TEST_FILE_PATH);

  assertEquals(res.status, 200);
  assertEquals(await res.text(), TEST_FILE_TEXT);
});

Deno.test("serveFile() handles file not found", async () => {
  const req = new Request("http://localhost/testdata/non_existent.txt");
  const testdataPath = join(testdataDir, "non_existent.txt");
  const res = await serveFile(req, testdataPath);
  await res.body?.cancel();

  assertEquals(res.status, 404);
  assertEquals(res.statusText, "Not Found");
});

Deno.test("serveFile() handles method not allowed", async () => {
  const req = new Request("http://localhost/testdata/test_file.txt", {
    method: "POST",
  });
  const res = await serveFile(req, TEST_FILE_PATH);
  await res.body?.cancel();

  assertEquals(res.status, 405);
  assertEquals(res.statusText, "Method Not Allowed");
});

Deno.test("serveFile() serves HTTP 404 when the path is a directory", async () => {
  const req = new Request("http://localhost/testdata/");
  const res = await serveFile(req, testdataDir);
  await res.body?.cancel();

  assertEquals(res.status, 404);
  assertEquals(res.statusText, "Not Found");
});

Deno.test("serveFile() handles bad range request (bytes=200-500)", async () => {
  const req = new Request("http://localhost/testdata/test_file.txt", {
    headers: { range: "bytes=200-500" },
  });
  const res = await serveFile(req, TEST_FILE_PATH);

  assertEquals(res.status, 206);
  assertEquals((await res.arrayBuffer()).byteLength, 301);
});

Deno.test("serveFile() handles bad range request (bytes=500-200)", async () => {
  const req = new Request("http://localhost/testdata/test_file.txt", {
    headers: { range: "bytes=500-200" },
  });
  const res = await serveFile(req, TEST_FILE_PATH);
  await res.body?.cancel();

  assertEquals(res.status, 416);
});

Deno.test("serveFile() serves HTTP 304 response for if-modified-since request of unmodified file", async () => {
  const req = new Request("http://localhost/testdata/test_file.txt", {
    headers: { "if-none-match": TEST_FILE_ETAG },
  });
  const res = await serveFile(req, TEST_FILE_PATH);

  assertEquals(res.status, 304);
  assertEquals(res.statusText, "Not Modified");
});

/**
 * When used in combination with If-None-Match, If-Modified-Since is ignored.
 * If etag doesn't match, don't return 304 even if if-modified-since is a valid
 * value.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since}
 */
Deno.test("serveFile() only uses if-none-match header if if-non-match and if-modified-since headers are provided", async () => {
  const req = new Request("http://localhost/testdata/test_file.txt", {
    headers: {
      "if-none-match": "not match etag",
      "if-modified-since": TEST_FILE_LAST_MODIFIED,
    },
  });
  const res = await serveFile(req, TEST_FILE_PATH);
  await res.body?.cancel();

  assertEquals(res.status, 200);
  assertEquals(res.statusText, "OK");
});

Deno.test("serveFile() etag value falls back to DENO_DEPLOYMENT_ID if fileInfo.mtime is not available", async () => {
  const DENO_DEPLOYMENT_ID = "__THIS_IS_DENO_DEPLOYMENT_ID__";
  const hashedDenoDeploymentId = await eTag(DENO_DEPLOYMENT_ID, {
    weak: true,
  });
  // deno-fmt-ignore
  const code = `
    import { serveFile } from "${import.meta.resolve("./file_server.ts")}";
    import { fromFileUrl } from "${import.meta.resolve("../path/mod.ts")}";
    import { assertEquals } from "${import.meta.resolve("../assert/equals.ts")}";
    const testdataPath = "${toFileUrl(join(testdataDir, "test_file.txt"))}";
    const fileInfo = await Deno.stat(new URL(testdataPath));
    fileInfo.mtime = null;
    const req = new Request("http://localhost/testdata/test_file.txt");
    const res = await serveFile(req, fromFileUrl(testdataPath), { fileInfo });
    assertEquals(res.headers.get("etag"), \`${hashedDenoDeploymentId}\`);
  `;
  const command = new Deno.Command(Deno.execPath(), {
    args: ["eval", "--no-lock", code],
    stdout: "null",
    stderr: "null",
    env: { DENO_DEPLOYMENT_ID },
  });
  const { success } = await command.output();
  assert(success);
});

Deno.test("serveDir() without options serves files in current directory", async () => {
  const req = new Request("http://localhost/http/testdata/hello.html");
  const res = await serveDir(req);

  assertEquals(res.status, 200);
  assertStringIncludes(await res.text(), "Hello World");
});

Deno.test("serveDir() with fsRoot and urlRoot option serves files in given directory", async () => {
  const req = new Request(
    "http://localhost/my-static-root/testdata/hello.html",
  );
  const res = await serveDir(req, {
    fsRoot: "http",
    urlRoot: "my-static-root",
  });

  assertEquals(res.status, 200);
  assertStringIncludes(await res.text(), "Hello World");
});

Deno.test("serveDir() serves index.html when showIndex is true", async () => {
  const url = "http://localhost/http/testdata/subdir-with-index/";
  const expectedText = "This is subdir-with-index/index.html";
  {
    const res = await serveDir(new Request(url), { showIndex: true });
    assertEquals(res.status, 200);
    assertStringIncludes(await res.text(), expectedText);
  }

  {
    // showIndex is true by default
    const res = await serveDir(new Request(url));
    assertEquals(res.status, 200);
    assertStringIncludes(await res.text(), expectedText);
  }
});

Deno.test("serveDir() doesn't serve index.html when showIndex is false", async () => {
  const req = new Request(
    "http://localhost/http/testdata/subdir-with-index/",
  );
  const res = await serveDir(req, { showIndex: false });

  assertEquals(res.status, 404);
});

Deno.test(
  "serveDir() redirects a directory URL not ending with a slash if it has an index",
  async () => {
    const url = "http://localhost/http/testdata/subdir-with-index";
    const res = await serveDir(new Request(url), { showIndex: true });

    assertEquals(res.status, 301);
    assertEquals(
      res.headers.get("Location"),
      "http://localhost/http/testdata/subdir-with-index/",
    );
  },
);

Deno.test("serveDir() redirects a directory URL not ending with a slash correctly even with a query string", async () => {
  const url = "http://localhost/http/testdata/subdir-with-index?test";
  const res = await serveDir(new Request(url), { showIndex: true });

  assertEquals(res.status, 301);
  assertEquals(
    res.headers.get("Location"),
    "http://localhost/http/testdata/subdir-with-index/?test",
  );
});

Deno.test("serveDir() redirects a file URL ending with a slash correctly even with a query string", async () => {
  const url = "http://localhost/http/testdata/test_file.txt/?test";
  const res = await serveDir(new Request(url), { showIndex: true });

  assertEquals(res.status, 301);
  assertEquals(
    res.headers.get("Location"),
    "http://localhost/http/testdata/test_file.txt?test",
  );
});

Deno.test("serveDir() redirects non-canonical URLs", async () => {
  const url = "http://localhost/http/testdata//////test_file.txt/////?test";
  const res = await serveDir(new Request(url), { showIndex: true });

  assertEquals(res.status, 301);
  assertEquals(
    res.headers.get("Location"),
    "http://localhost/http/testdata/test_file.txt/?test",
  );
});

Deno.test("serveDir() serves HTTP 304 for if-none-match requests with W/-prefixed etag", async () => {
  const testurl = "http://localhost/desktop.ini";
  const fileurl = new URL("./testdata/desktop.ini", import.meta.url);
  const req1 = new Request(testurl, {
    headers: { "accept-encoding": "gzip, deflate, br" },
  });
  const res1 = await serveDir(req1, serveDirOptions);
  const etag = res1.headers.get("etag");

  assertEquals(res1.status, 200);
  assertEquals(res1.statusText, "OK");
  assertEquals(await Deno.readTextFile(fileurl), await res1.text());
  assert(typeof etag === "string");
  assert(etag.length > 0);
  assert(etag.startsWith("W/"));

  const req2 = new Request(testurl, {
    headers: { "if-none-match": etag },
  });
  const res2 = await serveDir(req2, serveDirOptions);

  assertEquals(res2.status, 304);
  assertEquals(res2.statusText, "Not Modified");
  assertEquals("", await res2.text());
  assert(
    etag === res2.headers.get("etag") ||
      etag === "W/" + res2.headers.get("etag"),
  );
});

Deno.test("serveDir() resolves path correctly on Windows", {
  ignore: Deno.build.os !== "windows",
}, async () => {
  const req = new Request("http://localhost/");
  const res = await serveDir(req, { ...serveDirOptions, fsRoot: "c:/" });
  await res.body?.cancel();

  assertEquals(res.status, 200);
});

Deno.test(
  "serveDir() resolves empty sub-directory without asking for current directory read permissions on Windows",
  {
    ignore: Deno.build.os !== "windows",
    permissions: {
      read: [`${moduleDir}/testdata`],
      write: true,
    },
  },
  async () => {
    const tempDir = await Deno.makeTempDir({
      dir: `${moduleDir}/testdata`,
    });
    const req = new Request(`http://localhost/${basename(tempDir)}/`);
    const res = await serveDir(req, serveDirOptions);
    await res.body?.cancel();

    assertEquals(res.status, 200);

    await Deno.remove(tempDir);
  },
);

Deno.test("file_server prints local and network urls", async () => {
  const port = await getAvailablePort();
  const process = spawnDeno([
    "--allow-net",
    "--allow-read",
    "--allow-sys=networkInterfaces",
    "http/file_server.ts",
    "--port",
    `${port}`,
  ]);
  const output = await readUntilMatch(process.stdout, "Network:");
  const networkAdress = Deno.networkInterfaces().find((i) =>
    i.family === "IPv4" && !i.address.startsWith("127")
  )?.address;
  assertEquals(
    output,
    `Listening on:\n- Local: http://${LOCALHOST}:${port}\n- Network: http://${networkAdress}:${port}\n`,
  );
  process.stdout.cancel();
  process.stderr.cancel();
  process.kill();
  await process.status;
});

Deno.test("file_server doesn't print local network url without --allow-sys", async () => {
  const port = await getAvailablePort();
  const process = spawnDeno([
    "--allow-net",
    "--allow-read",
    "http/file_server.ts",
    "--port",
    `${port}`,
  ]);
  const output = await readUntilMatch(process.stdout, "Local:");
  assertEquals(
    output,
    `Listening on:\n- Local: http://${LOCALHOST}:${port}\n`,
  );
  process.stdout.cancel();
  process.stderr.cancel();
  process.kill();
  await process.status;
});

Deno.test("file_server prints only local address on Deploy", async () => {
  const port = await getAvailablePort();
  const process = spawnDeno([
    "--allow-net",
    "--allow-read",
    "--allow-sys=networkInterfaces",
    "--allow-env=DENO_DEPLOYMENT_ID",
    "http/file_server.ts",
    "--port",
    `${port}`,
  ], {
    env: {
      DENO_DEPLOYMENT_ID: "abcdef",
    },
  });
  const output = await readUntilMatch(process.stdout, "Local:");
  assertEquals(
    output,
    `Listening on:\n- Local: http://${LOCALHOST}:${port}\n`,
  );
  process.stdout.cancel();
  process.stderr.cancel();
  process.kill();
  await process.status;
});

/** Spawn deno child process with the options convenient for testing */
function spawnDeno(args: string[], opts?: Deno.CommandOptions) {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-lock",
      "--quiet",
      ...args,
    ],
    stdout: "piped",
    stderr: "piped",
    ...opts,
  });
  return cmd.spawn();
}

async function readUntilMatch(
  source: ReadableStream,
  match: string,
) {
  const reader = source.getReader();
  let buf = new Uint8Array(0);
  const dec = new TextDecoder();
  while (!dec.decode(buf).includes(match)) {
    const { value } = await reader.read();
    if (!value) {
      break;
    }
    buf = concat([buf, value]);
  }
  reader.releaseLock();
  return dec.decode(buf);
}
