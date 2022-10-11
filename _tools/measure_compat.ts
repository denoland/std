// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { walk } from "../fs/walk.ts";
import { withoutAll } from "../collections/without_all.ts";
import { intersect } from "../collections/intersect.ts";

// deno-lint-ignore no-explicit-any
type Object = Record<string, any>;

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

async function getTestsOverview(): Promise<Record<string, string[]>> {
  const nodeTestDirSHA = await getNodeTestDirSHA();
  const nodeTests = await getNodeTests(nodeTestDirSHA);

  const denoTests = await getDenoTests();

  return {
    passing: intersect(nodeTests, denoTests),
    remaining: withoutAll(nodeTests, denoTests),
  };
}

async function main() {
  console.log(await getTestsOverview());
}

if (import.meta.main) {
  await main();
}
