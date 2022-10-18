// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { walk } from "../fs/walk.ts";
import { withoutAll } from "../collections/without_all.ts";

// deno-lint-ignore no-explicit-any
type Object = Record<string, any>;

const encoder = new TextEncoder();

const NODE_BASE_URL = "https://api.github.com/repos/nodejs/node";

async function getNodeTestDirSHA(): Promise<string> {
  const response = await fetch(NODE_BASE_URL + "/contents");
  const body = await response.json();
  return body
    .find(({ name }: Object) => name === "test")
    .sha;
}

async function getNodeTests(sha: string): Promise<string[]> {
  const url = NODE_BASE_URL + "/git/trees/" + sha + "?recursive=1";
  const response = await fetch(url);
  const body = await response.json();

  return body.tree
    .filter(({ path }: Object) => path.endsWith(".js"))
    .map(({ path }: Object) => path);
}

async function getDenoTests(): Promise<string[]> {
  const files: string[] = [];
  const denoTestDir = new URL("../node/_tools/test", import.meta.url);

  for await (const { path } of walk(denoTestDir, { exts: [".js"] })) {
    files.push(path);
  }

  return files
    .map((file: string) => file.replace(denoTestDir.pathname + "/", ""));
}

async function getMissingTests(): Promise<string[]> {
  const nodeTestDirSHA = await getNodeTestDirSHA();
  const nodeTests = await getNodeTests(nodeTestDirSHA);

  const denoTests = await getDenoTests();

  return withoutAll(nodeTests, denoTests);
}

async function main() {
  const file = await Deno.open(new URL("../node/TODO.md", import.meta.url), {
    write: true,
  });

  await file.write(encoder.encode("# Remaining Node Tests\n\n"));

  for await (const test of await getMissingTests()) {
    await file.write(encoder.encode(`- [ ] ${test}\n`));
  }

  file.close();
}

if (import.meta.main) {
  await main();
}
