// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "../testing/asserts.ts";
import { iterateReader } from "../streams/iterate_reader.ts";
import { writeAll } from "../streams/write_all.ts";
import { TextLineStream } from "../streams/text_line_stream.ts";
import { serveDir, serveFile } from "./file_server.ts";
import { dirname, fromFileUrl, join, resolve, toFileUrl } from "../path/mod.ts";
import { isWindows } from "../_util/os.ts";
import { toHashString } from "../crypto/to_hash_string.ts";
import { createHash } from "../crypto/_util.ts";
import { VERSION } from "../version.ts";
import { retry } from "../async/retry.ts";

let child: Deno.ChildProcess;

interface FileServerCfg {
  port?: string;
  cors?: boolean;
  "dir-listing"?: boolean;
  dotfiles?: boolean;
  host?: string;
  cert?: string;
  key?: string;
  help?: boolean;
  target?: string;
  headers?: string[];
}

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");

async function startFileServer({
  target = ".",
  port = "4507",
  "dir-listing": dirListing = true,
  dotfiles = true,
  headers = [],
}: FileServerCfg = {}) {
  const fileServer = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "--allow-read",
      "--allow-net",
      "file_server.ts",
      target,
      "--cors",
      "-p",
      `${port}`,
      `${dirListing ? "" : "--no-dir-listing"}`,
      `${dotfiles ? "" : "--no-dotfiles"}`,
      ...headers.map((header) => "-H=" + header),
    ],
    cwd: moduleDir,
    stdout: "piped",
    stderr: "null",
  });
  child = fileServer.spawn();
  // Once fileServer is ready it will write to its stdout.
  const r = child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
    new TextLineStream(),
  );
  const reader = r.getReader();
  const res = await reader.read();
  assert(!res.done && res.value.includes("Listening"));
  reader.releaseLock();
}

async function startFileServerAsLibrary({}: FileServerCfg = {}) {
  const fileServer = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "--allow-read",
      "--allow-net",
      "testdata/file_server_as_library.ts",
    ],
    cwd: moduleDir,
    stdout: "piped",
    stderr: "null",
  });
  child = fileServer.spawn();
  const r = child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
    new TextLineStream(),
  );
  const reader = r.getReader();
  const res = await reader.read();
  assert(!res.done && res.value.includes("Server running..."));
  reader.releaseLock();
}

async function killFileServer() {
  // Note: We retry this because 'Access is denied' error is thrown sometimes
  // on windows
  await retry(() => {
    try {
      child.kill("SIGKILL");
    } catch (e) {
      if (
        e instanceof TypeError &&
        e.message === "Child process has already terminated."
      ) {
        return;
      }
      throw e;
    }
  });
  await child.status;
}

/* HTTP GET request allowing arbitrary paths */
async function fetchExactPath(
  hostname: string,
  port: number,
  path: string,
): Promise<Response> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const request = encoder.encode("GET " + path + " HTTP/1.1\r\n\r\n");
  let conn: void | Deno.Conn;
  try {
    conn = await Deno.connect(
      { hostname: hostname, port: port, transport: "tcp" },
    );
    await writeAll(conn, request);
    let currentResult = "";
    let contentLength = -1;
    let startOfBody = -1;
    for await (const chunk of iterateReader(conn)) {
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
  } finally {
    if (conn) {
      conn.close();
    }
  }
}

Deno.test(
  "file_server serveFile",
  async () => {
    await startFileServer();
    try {
      const res = await fetch("http://localhost:4507/mod.ts");
      assertEquals(
        res.headers.get("content-type"),
        "video/mp2t",
      );
      const downloadedFile = await res.text();
      const localFile = new TextDecoder().decode(
        await Deno.readFile(join(moduleDir, "mod.ts")),
      );
      assertEquals(downloadedFile, localFile);
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server serveFile in testdata",
  async () => {
    await startFileServer({ target: "./testdata" });
    try {
      const res = await fetch("http://localhost:4507/hello.html");
      assertEquals(res.headers.get("content-type"), "text/html; charset=UTF-8");
      const downloadedFile = await res.text();
      const localFile = new TextDecoder().decode(
        await Deno.readFile(join(testdataDir, "hello.html")),
      );
      assertEquals(downloadedFile, localFile);
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server serveFile with filename including hash symbol",
  async () => {
    await startFileServer({ target: "./testdata" });
    try {
      const res = await fetch("http://localhost:4507/file%232.txt");
      assertEquals(
        res.headers.get("content-type"),
        "text/plain; charset=UTF-8",
      );
      const downloadedFile = await res.text();
      const localFile = new TextDecoder().decode(
        await Deno.readFile(join(testdataDir, "file#2.txt")),
      );
      assertEquals(downloadedFile, localFile);
    } finally {
      await killFileServer();
    }
  },
);

Deno.test("serveDirIndex", async function () {
  await startFileServer();
  try {
    const res = await fetch("http://localhost:4507/");
    const page = await res.text();
    assert(page.includes("mod.ts"));
    assert(page.includes(`<a href="/testdata/">testdata/</a>`));

    // `Deno.FileInfo` is not completely compatible with Windows yet
    // TODO(bartlomieju): `mode` should work correctly in the future.
    // Correct this test case accordingly.
    isWindows === false &&
      assert(/<td class="mode">(\s)*[a-zA-Z- ]{14}(\s)*<\/td>/.test(page));
    isWindows &&
      assert(/<td class="mode">(\s)*\(unknown mode\)(\s)*<\/td>/.test(page));
    assert(page.includes(`<a href="/mod.ts">mod.ts</a>`));
  } finally {
    await killFileServer();
  }
});

Deno.test("serveDirIndex with filename including percent symbol", async function () {
  await startFileServer();
  try {
    const res = await fetch("http://localhost:4507/testdata/");
    const page = await res.text();
    assertStringIncludes(page, "%2525A.txt");
  } finally {
    await killFileServer();
  }
});

Deno.test("serveDirIndex with filename including hash symbol", async function () {
  await startFileServer();
  try {
    const res = await fetch("http://localhost:4507/testdata/");
    const page = await res.text();
    assertStringIncludes(page, "/testdata/file%232.txt");
  } finally {
    await killFileServer();
  }
});

Deno.test("serveFallback", async function () {
  await startFileServer();
  try {
    const res = await fetch("http://localhost:4507/badfile.txt");
    assertEquals(res.status, 404);
    const _ = await res.text();
  } finally {
    await killFileServer();
  }
});

Deno.test("checkPathTraversal", async function () {
  await startFileServer();
  try {
    const res = await fetch(
      "http://localhost:4507/../../../../../../../..",
    );

    assertEquals(res.status, 200);
    const listing = await res.text();
    assertStringIncludes(listing, "mod.ts");
  } finally {
    await killFileServer();
  }
});

Deno.test("checkPathTraversalNoLeadingSlash", async function () {
  await startFileServer();
  try {
    const res = await fetchExactPath("127.0.0.1", 4507, "../../../..");
    assertEquals(res.status, 400);
  } finally {
    await killFileServer();
  }
});

Deno.test("checkPathTraversalAbsoluteURI", async function () {
  await startFileServer();
  try {
    //allowed per https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
    const res = await fetchExactPath(
      "127.0.0.1",
      4507,
      "http://localhost/../../../..",
    );
    assertEquals(res.status, 200);
    assertStringIncludes(await res.text(), "mod.ts");
  } finally {
    await killFileServer();
  }
});

Deno.test("checkURIEncodedPathTraversal", async function () {
  await startFileServer();
  try {
    const res = await fetch(
      "http://localhost:4507/%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2F..",
    );

    assertEquals(res.status, 200);
    assertStringIncludes(await res.text(), "mod.ts");
  } finally {
    await killFileServer();
  }
});

Deno.test("serveWithUnorthodoxFilename", async function () {
  await startFileServer();
  try {
    let res = await fetch("http://localhost:4507/testdata/%25");
    assert(res.headers.has("access-control-allow-origin"));
    assert(res.headers.has("access-control-allow-headers"));
    assertEquals(res.status, 200);
    const _ = await res.text();
    res = await fetch("http://localhost:4507/testdata/test%20file.txt");
    assert(res.headers.has("access-control-allow-origin"));
    assert(res.headers.has("access-control-allow-headers"));
    assertEquals(res.status, 200);
    await res.text(); // Consuming the body so that the test doesn't leak resources
  } finally {
    await killFileServer();
  }
});

Deno.test("CORS support", async function () {
  await startFileServer();
  try {
    const directoryRes = await fetch("http://localhost:4507/");
    assert(directoryRes.headers.has("access-control-allow-origin"));
    assert(directoryRes.headers.has("access-control-allow-headers"));
    assertEquals(directoryRes.status, 200);
    await directoryRes.text(); // Consuming the body so that the test doesn't leak resources

    const fileRes = await fetch("http://localhost:4507/testdata/hello.html");
    assert(fileRes.headers.has("access-control-allow-origin"));
    assert(fileRes.headers.has("access-control-allow-headers"));
    assertEquals(fileRes.status, 200);
    await fileRes.text(); // Consuming the body so that the test doesn't leak resources
  } finally {
    await killFileServer();
  }
});

Deno.test("printHelp", async function () {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "file_server.ts",
      "--help",
    ],
    cwd: moduleDir,
  });
  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);
  assert(output.includes(`Deno File Server ${VERSION}`));
});

Deno.test("printVersion", async function () {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "file_server.ts",
      "--version",
    ],
    cwd: moduleDir,
  });
  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);
  assert(output.includes(`Deno File Server ${VERSION}`));
});

Deno.test("contentType", async () => {
  await startFileServer();
  try {
    const res = await fetch("http://localhost:4507/testdata/hello.html");
    const contentType = res.headers.get("content-type");
    assertEquals(contentType, "text/html; charset=UTF-8");
    await res.text(); // Consuming the body so that the test doesn't leak resources
  } finally {
    await killFileServer();
  }
});

Deno.test("file_server running as library", async function () {
  await startFileServerAsLibrary();
  try {
    const res = await fetch("http://localhost:8000");
    assertEquals(res.status, 200);
    const _ = await res.text();
  } finally {
    await killFileServer();
  }
});

Deno.test("file_server should ignore query params", async () => {
  await startFileServer();
  try {
    const res = await fetch("http://localhost:4507/mod.ts?key=value");
    assertEquals(res.status, 200);
    const downloadedFile = await res.text();
    const localFile = new TextDecoder().decode(
      await Deno.readFile(join(moduleDir, "mod.ts")),
    );
    assertEquals(downloadedFile, localFile);
  } finally {
    await killFileServer();
  }
});

async function startTlsFileServer({
  target = ".",
  port = "4577",
}: FileServerCfg = {}) {
  const fileServer = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "--allow-read",
      "--allow-net",
      "file_server.ts",
      target,
      "--host",
      "localhost",
      "--cert",
      "./testdata/tls/localhost.crt",
      "--key",
      "./testdata/tls/localhost.key",
      "--cors",
      "-p",
      `${port}`,
    ],
    cwd: moduleDir,
    stdout: "piped",
    stderr: "null",
  });
  child = fileServer.spawn();
  // Once fileServer is ready it will write to its stdout.
  const r = child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
    new TextLineStream(),
  );
  const reader = r.getReader();
  const res = await reader.read();
  assert(!res.done && res.value.includes("Listening"));
  reader.releaseLock();
}

Deno.test("serveDirIndex TLS", async function () {
  await startTlsFileServer();
  try {
    // Valid request after invalid
    const conn = await Deno.connectTls({
      hostname: "localhost",
      port: 4577,
      certFile: join(testdataDir, "tls/RootCA.pem"),
    });

    await writeAll(
      conn,
      new TextEncoder().encode("GET / HTTP/1.0\r\n\r\n"),
    );
    const res = new Uint8Array(128 * 1024);
    const nread = await conn.read(res);
    assert(nread !== null);
    conn.close();
    const page = new TextDecoder().decode(res.subarray(0, nread));
    assert(page.includes("<title>Deno File Server</title>"));
  } finally {
    await killFileServer();
  }
});

Deno.test("partial TLS arguments fail", async function () {
  const fileServer = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "--allow-read",
      "--allow-net",
      "file_server.ts",
      ".",
      "--host",
      "localhost",
      "--cert",
      "./testdata/tls/localhost.crt",
      "-p",
      `4578`,
    ],
    cwd: moduleDir,
    stdout: "piped",
    stderr: "null",
  });
  child = fileServer.spawn();
  try {
    // Once fileServer is ready it will write to its stdout.
    const r = child.stdout.pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    const reader = r.getReader();
    const res = await reader.read();
    assert(
      !res.done && res.value.includes("--key and --cert are required for TLS"),
    );
    reader.releaseLock();
  } finally {
    await killFileServer();
  }
});

Deno.test("file_server disable dir listings", async function () {
  await startFileServer({ "dir-listing": false });
  try {
    const res = await fetch("http://localhost:4507/");

    assertEquals(res.status, 404);
    const _ = await res.text();
  } finally {
    await killFileServer();
  }
});

Deno.test("file_server do not show dotfiles", async function () {
  await startFileServer({ dotfiles: false });
  try {
    let res = await fetch("http://localhost:4507/testdata/");
    assert(!(await res.text()).includes(".dotfile"));

    res = await fetch("http://localhost:4507/testdata/.dotfile");
    assertEquals(await res.text(), "dotfile");
  } finally {
    await killFileServer();
  }
});

Deno.test("file_server should show .. if it makes sense", async function (): Promise<
  void
> {
  await startFileServer();
  try {
    let res = await fetch("http://localhost:4507/");
    let page = await res.text();
    assert(!page.includes("../"));
    assert(page.includes("testdata/"));

    res = await fetch("http://localhost:4507/testdata/");
    page = await res.text();
    assert(page.includes("../"));
  } finally {
    await killFileServer();
  }
});

Deno.test(
  "file_server should download first byte of hello.html file",
  async () => {
    await startFileServer();
    try {
      const headers = {
        "range": "bytes=0-0",
      };
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      const text = await res.text();
      console.log(text);
      assertEquals(text, "L");
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server sets `content-range` header for range request responses",
  async () => {
    await startFileServer();
    try {
      const headers = {
        "range": "bytes=0-100",
      };
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      const contentLength = await getTestFileSize();
      assertEquals(
        res.headers.get("content-range"),
        `bytes 0-100/${contentLength}`,
      );

      await res.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

const getTestFileSize = async () => {
  const fileInfo = await getTestFileStat();
  return fileInfo.size;
};

const getTestFileStat = async (): Promise<Deno.FileInfo> => {
  const fsPath = join(testdataDir, "test file.txt");
  const fileInfo = await Deno.stat(fsPath);

  return fileInfo;
};

const getTestFileEtag = async () => {
  const fileInfo = await getTestFileStat();

  if (fileInfo.mtime instanceof Date) {
    const lastModified = new Date(fileInfo.mtime);
    const simpleEtag = toHashString(
      await createHash("FNV32A", lastModified.toJSON() + fileInfo.size),
    );
    return simpleEtag;
  } else {
    return "";
  }
};

const getTestFileLastModified = async () => {
  const fileInfo = await getTestFileStat();

  if (fileInfo.mtime instanceof Date) {
    return new Date(fileInfo.mtime).toUTCString();
  } else {
    return "";
  }
};

Deno.test(
  "file_server returns 206 for range request responses",
  async () => {
    await startFileServer();
    try {
      const headers = {
        "range": "bytes=0-100",
      };
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      await res.text(); // Consuming the body so that the test doesn't leak resources
      assertEquals(res.status, 206);
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server should download from 300 bytes into `hello.html` file until the end",
  async () => {
    await startFileServer();
    try {
      const headers = {
        "range": "bytes=300-",
      };
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      const text = await res.text();

      const localFile = new TextDecoder().decode(
        await Deno.readFile(join(testdataDir, "test file.txt")),
      );

      const contentLength = await getTestFileSize();
      assertEquals(
        res.headers.get("content-range"),
        `bytes 300-${contentLength - 1}/${contentLength}`,
      );
      assertEquals(text, localFile.substring(300));
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server should return 416 due to a bad range request (500-200)",
  async () => {
    await startFileServer();
    try {
      const headers = {
        "range": "bytes=500-200",
      };
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      await res.text();
      assertEquals(res.status, 416);
      assertEquals(res.statusText, "Range Not Satisfiable");
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server should return 416 due to a bad range request (-200)",
  async () => {
    await startFileServer();
    try {
      const headers = {
        "range": "bytes=-200",
      };
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      await res.text();
      assertEquals(res.status, 416);
      assertEquals(res.statusText, "Range Not Satisfiable");
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server should return 416 due to a bad range request (100)",
  async () => {
    await startFileServer();
    try {
      const headers = {
        "range": "bytes=100",
      };
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      await res.text();
      assertEquals(res.status, 416);
      assertEquals(res.statusText, "Range Not Satisfiable");
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server should return 416 due to a bad range request (a-b)",
  async () => {
    await startFileServer();
    try {
      const headers = {
        "range": "bytes=a-b",
      };
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      await res.text();
      assertEquals(res.status, 416);
      assertEquals(res.statusText, "Range Not Satisfiable");
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server returns correct mime-types",
  async () => {
    await startFileServer();
    try {
      const txtRes = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
      );
      assertEquals(
        txtRes.headers.get("content-type"),
        "text/plain; charset=UTF-8",
      );
      await txtRes.text(); // Consuming the body so that the test doesn't leak resources

      const htmlRes = await fetch("http://localhost:4507/testdata/hello.html");
      assertEquals(
        htmlRes.headers.get("content-type"),
        "text/html; charset=UTF-8",
      );
      await htmlRes.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server sets `accept-ranges` header to `bytes` for directory listings",
  async () => {
    await startFileServer();
    try {
      const res = await fetch("http://localhost:4507/");
      assertEquals(res.headers.get("accept-ranges"), "bytes");
      await res.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server sets `accept-ranges` header to `bytes` for file responses",
  async () => {
    await startFileServer();
    try {
      const res = await fetch("http://localhost:4507/testdata/test%20file.txt");
      assertEquals(res.headers.get("accept-ranges"), "bytes");
      await res.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

Deno.test("file_server sets `Last-Modified` header correctly", async () => {
  await startFileServer();
  try {
    const res = await fetch("http://localhost:4507/testdata/test%20file.txt");

    const lastModifiedHeader = res.headers.get("last-modified") as string;
    const lastModifiedTime = Date.parse(lastModifiedHeader);

    const fileInfo = await getTestFileStat();
    const expectedTime = fileInfo.mtime && fileInfo.mtime instanceof Date
      ? fileInfo.mtime.getTime()
      : Number.NaN;

    const round = (d: number) => Math.floor(d / 1000 / 60 / 30); // Rounds epochs to 2 minute units, to accommodate minor variances in how long the test(s) take to execute
    assertEquals(round(lastModifiedTime), round(expectedTime));
    await res.text(); // Consuming the body so that the test doesn't leak resources
  } finally {
    await killFileServer();
  }
});

Deno.test("file_server sets `Date` header correctly", async () => {
  await startFileServer();
  try {
    const res = await fetch("http://localhost:4507/testdata/test%20file.txt");
    const dateHeader = res.headers.get("date") as string;
    const date = Date.parse(dateHeader);
    const fileInfo = await getTestFileStat();
    const expectedTime = fileInfo.atime && fileInfo.atime instanceof Date
      ? fileInfo.atime.getTime()
      : Number.NaN;
    const round = (d: number) => Math.floor(d / 1000 / 60 / 30); // Rounds epochs to 2 minute units, to accommodate minor variances in how long the test(s) take to execute
    assertEquals(round(date), round(expectedTime));
    await res.text(); // Consuming the body so that the test doesn't leak resources
  } finally {
    await killFileServer();
  }
});

Deno.test(
  "file_server sets headers correctly if provided as arguments",
  async () => {
    await startFileServer({
      headers: ["cache-control:max-age=100", "x-custom-header:hi"],
    });
    try {
      const res = await fetch("http://localhost:4507/testdata/test%20file.txt");
      assertEquals(res.headers.get("cache-control"), "max-age=100");
      assertEquals(res.headers.get("x-custom-header"), "hi");
      await res.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server file responses includes correct etag",
  async () => {
    await startFileServer();
    try {
      const res = await fetch("http://localhost:4507/testdata/test%20file.txt");
      const expectedEtag = await getTestFileEtag();
      assertEquals(res.headers.get("etag"), `W/${expectedEtag}`);
      await res.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server returns 304 for requests with if-none-match set with the etag",
  async () => {
    await startFileServer();
    try {
      const expectedEtag = await getTestFileEtag();
      const headers = new Headers();
      headers.set("if-none-match", expectedEtag);
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      assertEquals(res.status, 304);
      assertEquals(res.statusText, "Not Modified");
      await res.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server returns an empty body for 304 responses from requests with if-none-match set with the etag",
  async () => {
    await startFileServer();
    try {
      const expectedEtag = await getTestFileEtag();
      const headers = new Headers();
      headers.set("if-none-match", expectedEtag);
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      assertEquals(await res.text(), "");
      await res.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server returns 304 for requests with if-modified-since if the requested resource has not been modified after the given date",
  async () => {
    await startFileServer();
    try {
      const expectedIfModifiedSince = await getTestFileLastModified();
      const headers = new Headers();
      headers.set("if-modified-since", expectedIfModifiedSince);
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      assertEquals(res.status, 304);
      assertEquals(res.statusText, "Not Modified");
      await res.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server if both `if-none-match` and `if-modified-since` headers are provided, use only `if-none-match`",
  async () => {
    await startFileServer();
    try {
      // When used in combination with If-None-Match, If-Modified-Since is ignored
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
      // -> If etag doesn't match, don't return 304 even if if-modified-since is a valid value.

      const expectedIfModifiedSince = await getTestFileLastModified();
      const headers = new Headers();
      headers.set("if-none-match", "not match etag");
      headers.set("if-modified-since", expectedIfModifiedSince);
      const res = await fetch(
        "http://localhost:4507/testdata/test%20file.txt",
        { headers },
      );
      assertEquals(res.status, 200);
      assertEquals(res.statusText, "OK");
      await res.text(); // Consuming the body so that the test doesn't leak resources
    } finally {
      await killFileServer();
    }
  },
);

Deno.test(
  "file_server `serveFile` serve test file",
  async () => {
    const req = new Request("http://localhost:4507/testdata/test file.txt");
    const testdataPath = join(testdataDir, "test file.txt");
    const res = await serveFile(req, testdataPath);
    const localFile = new TextDecoder().decode(
      await Deno.readFile(testdataPath),
    );
    assertEquals(res.status, 200);
    assertEquals(await res.text(), localFile);
  },
);

Deno.test(
  "file_server `serveFile` returns 404 due to file not found",
  async () => {
    const req = new Request("http://localhost:4507/testdata/non_existent.txt");
    const testdataPath = join(testdataDir, "non_existent.txt");
    const res = await serveFile(req, testdataPath);
    assertEquals(res.status, 404);
    assertEquals(res.statusText, "Not Found");
  },
);

Deno.test(
  "file_server `serveFile` returns 404 when the given path is a directory",
  async () => {
    const req = new Request("http://localhost:4507/testdata/");
    const res = await serveFile(req, testdataDir);
    assertEquals(res.status, 404);
    assertEquals(res.statusText, "Not Found");
  },
);

Deno.test(
  "file_server `serveFile` should return 416 due to a bad range request (500-200)",
  async () => {
    const req = new Request("http://localhost:4507/testdata/test file.txt");
    req.headers.set("range", "bytes=500-200");
    const testdataPath = join(testdataDir, "test file.txt");
    const res = await serveFile(req, testdataPath);
    assertEquals(res.status, 416);
  },
);

Deno.test(
  "file_server `serveFile` returns 304 for requests with if-modified-since if the requested resource has not been modified after the given date",
  async () => {
    const req = new Request("http://localhost:4507/testdata/test file.txt");
    const expectedEtag = await getTestFileEtag();
    req.headers.set("if-none-match", expectedEtag);
    const testdataPath = join(testdataDir, "test file.txt");
    const res = await serveFile(req, testdataPath);
    assertEquals(res.status, 304);
    assertEquals(res.statusText, "Not Modified");
  },
);

Deno.test(
  "file_server `serveFile` if both `if-none-match` and `if-modified-since` headers are provided, use only `if-none-match`",
  async () => {
    // When used in combination with If-None-Match, If-Modified-Since is ignored
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
    // -> If etag doesn't match, don't return 304 even if if-modified-since is a valid value.

    const expectedIfModifiedSince = await getTestFileLastModified();
    const req = new Request("http://localhost:4507/testdata/test file.txt");
    req.headers.set("if-none-match", "not match etag");
    req.headers.set("if-modified-since", expectedIfModifiedSince);
    const testdataPath = join(testdataDir, "test file.txt");
    const res = await serveFile(req, testdataPath);
    assertEquals(res.status, 200);
    assertEquals(res.statusText, "OK");
    await res.text(); // Consuming the body so that the test doesn't leak resources
  },
);

Deno.test(
  "file_server `serveFile` etag value falls back to DENO_DEPLOYMENT_ID if fileInfo.mtime is not available",
  async () => {
    const testDenoDeploymentId = "__THIS_IS_DENO_DEPLOYMENT_ID__";
    const hashedDenoDeploymentId = toHashString(
      await createHash("FNV32A", testDenoDeploymentId),
    );
    // deno-fmt-ignore
    const code = `
      import { serveFile } from "${import.meta.resolve("./file_server.ts")}";
      import { fromFileUrl } from "${import.meta.resolve("../path/mod.ts")}";
      import { assertEquals } from "${import.meta.resolve("../testing/asserts.ts")}";
      const testdataPath = "${toFileUrl(join(testdataDir, "test file.txt"))}";
      const fileInfo = await Deno.stat(new URL(testdataPath));
      fileInfo.mtime = null;
      const req = new Request("http://localhost:4507/testdata/test file.txt");
      const res = await serveFile(req, fromFileUrl(testdataPath), { fileInfo });
      assertEquals(res.headers.get("etag"), "${hashedDenoDeploymentId}");
    `;
    const command = new Deno.Command(Deno.execPath(), {
      args: ["eval", code],
      stdout: "inherit",
      stderr: "inherit",
      env: { DENO_DEPLOYMENT_ID: testDenoDeploymentId },
    });
    const { success } = await command.output();
    assert(success);
  },
);

Deno.test(
  "serveDir (without options) serves files under the current dir",
  async () => {
    const req = new Request("http://localhost:4507/http/testdata/hello.html");
    const res = await serveDir(req);
    assertEquals(res.status, 200);
    assertStringIncludes(await res.text(), "Hello World");
  },
);

Deno.test(
  "serveDir (with fsRoot option) serves files under the given dir",
  async () => {
    const req = new Request("http://localhost:4507/testdata/hello.html");
    const res = await serveDir(req, { fsRoot: "http" });
    assertEquals(res.status, 200);
    assertStringIncludes(await res.text(), "Hello World");
  },
);

Deno.test(
  "serveDir (with fsRoot, urlRoot option) serves files under the given dir",
  async () => {
    const req = new Request(
      "http://localhost:4507/my-static-root/testdata/hello.html",
    );
    const res = await serveDir(req, {
      fsRoot: "http",
      urlRoot: "my-static-root",
    });
    assertEquals(res.status, 200);
    assertStringIncludes(await res.text(), "Hello World");
  },
);

Deno.test(
  "serveDir serves index.html when showIndex is true",
  async () => {
    const url = "http://localhost:4507/http/testdata/subdir-with-index/";
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
  },
);

Deno.test(
  "serveDir doesn't serve index.html when showIndex is false",
  async () => {
    const url = "http://localhost:4507/http/testdata/subdir-with-index/";
    const res = await serveDir(new Request(url), { showIndex: false });
    assertEquals(res.status, 404);
  },
);

Deno.test(
  "file_server returns 304 for requests with if-none-match set with the etag but with W/ prefixed etag in request headers.",
  async () => {
    await startFileServer();
    try {
      const testurl = "http://localhost:4507/testdata/desktop.ini";
      const fileurl = new URL("./testdata/desktop.ini", import.meta.url);
      let etag: string | undefined | null;

      {
        const res = await fetch(
          testurl,
          {
            headers: [
              ["Accept-Encoding", "gzip, deflate, br"],
            ],
          },
        );
        assertEquals(res.status, 200);
        assertEquals(res.statusText, "OK");

        const data = await Deno.readTextFile(
          fileurl,
        );
        assertEquals(data, await res.text()); // Consuming the body so that the test doesn't leak resources
        etag = res.headers.get("etag");
      }

      assert(typeof etag === "string");
      assert(etag.length > 0);
      assert(etag.startsWith("W/"));
      {
        const res = await fetch(
          testurl,
          {
            headers: {
              "if-none-match": etag,
            },
          },
        );
        assertEquals(res.status, 304);
        assertEquals(res.statusText, "Not Modified");
        assertEquals("", await res.text()); // Consuming the body so that the test doesn't leak resources
        assert(
          etag === res.headers.get("etag") ||
            etag === "W/" + res.headers.get("etag"),
        );
      }
    } finally {
      await killFileServer();
    }
  },
);
