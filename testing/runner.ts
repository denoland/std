#!/usr/bin/env deno -A
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { glob, walk } from "../fs/mod.ts";
import * as path from "../fs/path/mod.ts";
import { chunks } from "./runner_util.ts";
const { run, exit, writeFile, execPath, remove } = Deno;

const testingModPath = path.join(
  path.dirname(window.location.pathname),
  "./mod.ts"
);
const runTemplate = `
import { runTests } from "${testingModPath}";

async function run(): Promise<void> {
  console.log("running tests");
  await runTests();
}

run();
`;

const { cwd } = Deno;
const DEFAULT_GLOB = "**/*_test.ts";

async function main(): Promise<void> {
  // TODO: find all files matching _test.js/.ts pattern
  // find all files matching `pattern` glob
  const iterator = walk(cwd(), {
    match: [glob(DEFAULT_GLOB)]
  });

  console.log("iterator", walk);
  const foundTestFiles = [];

  for await (const { filename, info } of iterator) {
    // console.log("found path: ", filename);
    foundTestFiles.push(filename);
  }

  console.log("found " + foundTestFiles.length + " matching files");

  let testFile = "";

  foundTestFiles.forEach(
    (filename: string): void => {
      testFile += `import "${filename}";\n`;
    }
  );
  testFile += runTemplate;

  const testFileName = `test-${new Date().getTime()}.ts`;
  const encoder = new TextEncoder();
  await writeFile(testFileName, encoder.encode(testFile));
  const p = run({
    args: [execPath, "-A", testFileName],
    stdout: "piped"
  });

  for await (const line of chunks(p.stdout, "\n")) {
    console.log("DEBUG: ", line);
  }

  try {
    await p.status();
  } catch (e) {
    console.error(e);
    exit(1);
  } finally {
    await remove(testFileName);
  }
}

main();
