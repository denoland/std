import { readFile, run } from "deno";

import { test, assert, assertEqual, TestFunction } from "../testing/mod.ts";
import { BufReader } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";

async function testFileServer(t: TestFunction): Promise<void> {
  const name = t.name;
  async function fn() {
    let fileServer;
    try {
      fileServer = run({
        args: ["deno", "--allow-net", "http/file_server.ts", ".", "--cors"],
        stdout: "piped"
      });
      // Once fileServer is ready it will write to its stdout.
      const r = new TextProtoReader(new BufReader(fileServer.stdout));
      const [s, err] = await r.readLine();
      assert(err == null);
      assert(s.includes("server listening"));
      await t();
    } finally {
      fileServer.close();
      fileServer.stdout.close();
    }
  }
  test({ name, fn });
}

testFileServer(async function serveFile() {
  const res = await fetch("http://localhost:4500/azure-pipelines.yml");
  assert(res.headers.has("access-control-allow-origin"));
  assert(res.headers.has("access-control-allow-headers"));
  assertEqual(res.headers.get("content-type"), "text/yaml; charset=utf-8");
  const downloadedFile = await res.text();
  const localFile = new TextDecoder().decode(
    await readFile("./azure-pipelines.yml")
  );
  assertEqual(downloadedFile, localFile);
});

testFileServer(async function serveDirectory() {
  const res = await fetch("http://localhost:4500/");
  assert(res.headers.has("access-control-allow-origin"));
  assert(res.headers.has("access-control-allow-headers"));
  const page = await res.text();
  assert(page.includes("azure-pipelines.yml"));
});

testFileServer(async function serveFallback() {
  const res = await fetch("http://localhost:4500/badfile.txt");
  assert(res.headers.has("access-control-allow-origin"));
  assert(res.headers.has("access-control-allow-headers"));
  assertEqual(res.status, 404);
});
