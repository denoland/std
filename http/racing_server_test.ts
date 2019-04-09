// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
const { run } = Deno;

import { test } from "../testing/mod.ts";
import { assert, assertEquals } from "../testing/asserts.ts";
import { BufReader } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";

let server;
async function startServer(): Promise<void> {
  server = run({
    args: ["deno", "--A", "http/racing_server.ts"],
    stdout: "piped"
  });
  // Once fileServer is ready it will write to its stdout.
  const r = new TextProtoReader(new BufReader(server.stdout));
  const [s, err] = await r.readLine();
  assert(err == null);
  assert(s.includes("Racing server listening..."));
}
function killServer(): void {
  server.close();
  server.stdout.close();
}

let nc;
let ncIn = `GET / HTTP/1.1

GET / HTTP/1.1

`;
let ncOut = `HTTP/1.1 200 OK
content-length: 8

Hello 1
HTTP/1.1 200 OK
content-length: 8

World 2
`;

// Do not run this test on windows
if (Deno.build.os !== "win") {
  test(async function serverPipelineRace(): Promise<void> {
    await startServer();

    nc = run({
      args: ["nc", "localhost", "4501"],
      stdin: "piped",
      stdout: "piped"
    });
    const r = new TextProtoReader(new BufReader(nc.stdout));
    await nc.stdin.write(new TextEncoder().encode(ncIn));
    const ncOutLines = ncOut.split("\n");
    // length - 1 to disregard last empty line
    for (let i = 0; i < ncOutLines.length - 1; i++) {
      const [s, err] = await r.readLine();
      assert(!err);
      assertEquals(s, ncOutLines[i]);
    }
    nc.close();
    nc.stdout.close();
    killServer();
  });
}
