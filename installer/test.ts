// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
const { readFile, run, stat, makeTempDir, remove, env } = Deno;

import { test, runIfMain } from "../testing/mod.ts";
import { assert, assertEquals } from "../testing/asserts.ts";
import { BufReader, EOF } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";
import { install } from "./mod.ts";
import * as path from "../fs/path.ts";

let fileServer: Deno.Process;

// copied from `http/file_server_test.ts`
async function startFileServer(): Promise<void> {
  fileServer = run({
    args: [
      "deno",
      "run",
      "--allow-read",
      "--allow-net",
      "http/file_server.ts",
      ".",
      "--cors"
    ],
    stdout: "piped"
  });
  // Once fileServer is ready it will write to its stdout.
  const r = new TextProtoReader(new BufReader(fileServer.stdout!));
  const s = await r.readLine();
  assert(s !== EOF && s.includes("server listening"));
}

function killFileServer(): void {
  fileServer.close();
  fileServer.stdout!.close();
}

// TODO: create helper function with all setup
test(async function installerInstall(): Promise<void> {
  await startFileServer();
  const tempDir = await makeTempDir();
  const envVars = env();
  const originalHomeDir = envVars["HOME"];
  envVars["HOME"] = tempDir;

  try {
    await install("http://localhost:4500/http/file_server.ts", [
      "--allow-net",
      "--allow-read"
    ]);

    const filePath = path.resolve(tempDir, ".deno/bin/file_server");
    const fileInfo = await stat(filePath);
    assert(fileInfo.isFile());
    // TODO: verify that it's executable file

    const fileBytes = await readFile(filePath);
    const fileContents = new TextDecoder().decode(fileBytes);
    assertEquals(
      fileContents,
      "#/bin/sh\ndeno --allow-net --allow-read http://localhost:4500/http/file_server.ts $@"
    );
  } finally {
    killFileServer();
    await remove(tempDir, { recursive: true });
    envVars["HOME"] = originalHomeDir;
  }
});

runIfMain(import.meta);
