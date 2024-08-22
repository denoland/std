// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertEquals,
  assertFalse,
  assertStringIncludes,
} from "@std/assert";
import { eTag } from "./etag.ts";
import { dirname, fromFileUrl, join, resolve, toFileUrl } from "@std/path";
import { getAvailablePort } from "@std/net/get-available-port";
import { concat } from "@std/bytes/concat";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");

const LOCALHOST = Deno.build.os === "windows" ? "localhost" : "0.0.0.0";

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
