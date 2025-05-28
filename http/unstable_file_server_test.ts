// Copyright 2018-2025 the Deno authors. MIT license.
import { serveDir, ServeDirOptions } from "./unstable_file_server.ts";
import { dirname, fromFileUrl, join, resolve } from "@std/path";
import { assertEquals } from "@std/assert";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");
const serveDirOptions: ServeDirOptions = {
  quiet: true,
  fsRoot: testdataDir,
  showDirListing: true,
  showDotfiles: true,
  enableCors: true,
};

Deno.test("serveDir() serves files without the need of html extension when cleanUrls=true", async () => {
  const req = new Request("http://localhost/hello");
  const res = await serveDir(req, { ...serveDirOptions, cleanUrls: true });
  const downloadedFile = await res.text();
  const localFile = await Deno.readTextFile(join(testdataDir, "hello.html"));

  assertEquals(res.status, 200);
  assertEquals(downloadedFile, localFile);
  assertEquals(res.headers.get("content-type"), "text/html; charset=UTF-8");
});

Deno.test("serveDir() does not shadow existing files and directory if cleanUrls=true", async () => {
  const req = new Request("http://localhost/test_clean_urls");
  const res = await serveDir(req, { ...serveDirOptions, cleanUrls: true });

  assertEquals(res.status, 301);
  assertEquals(res.headers.has("location"), true);
});
