import { readFile, run } from "deno";

import { test, assert, assertEqual, setUp, tearDown } from "../testing/mod.ts";

let fileServer;
setUp(async function startFileServer() {
  fileServer = run({
    args: ["deno", "--allow-net", "http/file_server.ts", ".", "--cors"],
    stdout: "piped"
  });
  await until(async function() {
    // fileServer writes to stdout once it's serving.
    const data = new Uint8Array(50);
    const r = await fileServer.stdout.read(data);
    const s = new TextDecoder().decode(data.subarray(0, r.nread));
    return s.includes("server listening");
  });
});
tearDown(function killFileServer() {
  fileServer.close();
});

test(async function serveFile() {
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

test(async function serveDirectory() {
  const res = await fetch("http://localhost:4500/");
  assert(res.headers.has("access-control-allow-origin"));
  assert(res.headers.has("access-control-allow-headers"));
  const page = await res.text();
  assert(page.includes("azure-pipelines.yml"));
});

test(async function serveFallback() {
  const res = await fetch("http://localhost:4500/badfile.txt");
  assert(res.headers.has("access-control-allow-origin"));
  assert(res.headers.has("access-control-allow-headers"));
  assertEqual(res.status, 404);
});

async function until(
  isReady: () => boolean | Promise<boolean>,
  timeout: number = 10000
): Promise<void> {
  let t = 0;
  while (!(await isReady())) {
    await delay(1000);
    t += 1000;
    if (t > timeout) {
      throw Error(`Timeout waiting for ${isReady}`);
    }
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise(res => setTimeout(res, ms));
}
