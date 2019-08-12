#!/usr/bin/env deno -A
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { parse } from "../flags/mod.ts";
import { glob, walk } from "../fs/mod.ts";
import { runTests } from "./mod.ts";
const { args, cwd } = Deno;

// TODO: settle on list of default globs
const DEFAULT_GLOBS = ["**/*_test.ts", "**/*_test.js"];

// TODO: upgrade it
function showHelp() {
  console.log(`deno test-runner
  Test runner

USAGE:
  deno -A https://deno.land/std/testing/runner.ts [OPTIONS]

OPTIONS:
  -q, --quiet           Don't show output from test cases 
  -f, --failfast        Stop test suite on first error
  -g, --glob <PATH...>  List of globs for test files, defaults to: **/*_test.ts,**/*_test.js
`);
}

async function main(): Promise<void> {
  const parsedArgs = parse(args.slice(1), {
    boolean: ["quiet", "failfast", "help"],
    string: ["glob"],
    alias: {
      help: ["h"],
      quiet: ["q"],
      failfast: ["f"],
      glob: ["g"]
    }
  });

  if (parsedArgs.help) {
    return showHelp();
  }

  let fileGlobs;
  if (parsedArgs.glob) {
    fileGlobs = (parsedArgs.glob as string).split(",");
  } else {
    fileGlobs = DEFAULT_GLOBS;
  }

  const filesIterator = walk(cwd(), {
    match: fileGlobs.map(glob)
  });

  const foundTestFiles: Array<string> = [];
  for await (const { filename } of filesIterator) {
    foundTestFiles.push(filename);
  }

  console.log(`Found ${foundTestFiles.length} matching files.`);

  for (const filename of foundTestFiles) {
    await import(filename);
  }

  await runTests({
    exitOnFail: !!parsedArgs.failfast,
    disableLog: !!parsedArgs.quiet
  });
}

main();
