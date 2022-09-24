// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { walk } from "../fs/walk.ts";
import { partition } from "../collections/partition.ts";

// deno-lint-ignore no-explicit-any
type Object = Record<string, any>;

const NODE_BASE_URL = "https://api.github.com/repos/nodejs/node";

const tests: Record<string, boolean> = {};

async function getNodeTestDirSHA(): Promise<string> {
  const response = await fetch(NODE_BASE_URL + "/contents");
  const body = await response.json();
  return body
    .find(({ name }: Object) => name === "test")
    .sha;
}

async function getNodeTests(sha: string): Promise<Set<string>> {
  const url = NODE_BASE_URL + "/git/trees/" + sha + "?recursive=1";
  const response = await fetch(url);
  const body = await response.json();

  const result = body.tree
    .filter(({ path }: Object) => path.endsWith(".js"))
    .map(({ path }: Object) => path);

  return new Set(result);
}

async function getDenoTests(): Promise<Set<string>> {
  const files: string[] = [];
  const denoTestDir = new URL("../node/_tools/test", import.meta.url);

  for await (const { path } of walk(denoTestDir, { exts: [".js"] })) {
    files.push(path);
  }

  const results = files
    .map((file: string) => file.replace(denoTestDir.pathname + "/", ""));

  return new Set(results);
}

async function main() {
  const nodeTestDirSHA = await getNodeTestDirSHA();
  const nodeTests = await getNodeTests(nodeTestDirSHA);

  const denoTests = await getDenoTests();

  nodeTests.forEach((nodeTest) => tests[nodeTest] = denoTests.has(nodeTest));

  const [yes, no] = partition(Object.values(tests), Boolean);

  console.log(`Yes: ${yes.length}`);
  console.log(`No: ${no.length}`);
}

if (import.meta.main) {
  await main();
}
