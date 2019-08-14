#!/usr/bin/env deno -A
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { parse } from "../flags/mod.ts";
import { glob, isGlob, walk } from "../fs/mod.ts";
import { runTests } from "./mod.ts";
const { args, cwd } = Deno;

const DEFAULT_GLOBS = [
  "**/*_test.ts",
  "**/*_test.js",
  "**/test.ts",
  "**/test.js"
];

/* eslint-disable max-len */
function showHelp(): void {
  console.log(`Deno test runner

USAGE:
  deno -A https://deno.land/std/testing/runner.ts [OPTIONS] [FILES...]

OPTIONS:
  -q, --quiet               Don't show output from test cases 
  -f, --failfast            Stop test suite on first error
  -e, --exclude <FILES...>  List of file names to exclude from run. If this options is 
                            used files to match must be specified after "--". 
  
ARGS:
  [FILES...]  List of file names to run. Defaults to: ${DEFAULT_GLOBS.join(
    ","
  )} 
`);
}
/* eslint-enable max-len */

function filePathToRegExp(str: string): RegExp {
  if (isGlob(str)) {
    return glob(str);
  }

  return RegExp(str);
}

// TODO: change return type to `Promise<void>` once, `runTests` is updated
// to return boolean instead of exiting
export async function main(root: string = cwd()): Promise<void> {
  const parsedArgs = parse(args.slice(1), {
    boolean: ["quiet", "failfast", "help"],
    string: ["exclude"],
    alias: {
      help: ["h"],
      quiet: ["q"],
      failfast: ["f"],
      exclude: ["e"]
    }
  });

  if (parsedArgs.help) {
    return showHelp();
  }

  let includeFiles: string[];
  let excludeFiles: string[];

  if (parsedArgs._.length) {
    includeFiles = (parsedArgs._ as string[])
      .map(
        (fileGlob: string): string[] => {
          return fileGlob.split(",");
        }
      )
      .flat();
  } else {
    includeFiles = DEFAULT_GLOBS;
  }

  if (parsedArgs.exclude) {
    excludeFiles = (parsedArgs.exclude as string).split(",");
  } else {
    excludeFiles = [];
  }

  const filesIterator = walk(root, {
    match: includeFiles.map(f => filePathToRegExp(f)),
    skip: excludeFiles.map(f => filePathToRegExp(f))
  });

  const foundTestFiles: string[] = [];
  for await (const { filename } of filesIterator) {
    foundTestFiles.push(filename);
  }

  if (foundTestFiles.length === 0) {
    console.error("No matching test files found.");
    return;
  }

  console.log(`Found ${foundTestFiles.length} matching test files.`);

  for (const filename of foundTestFiles) {
    await import(filename);
  }

  await runTests({
    exitOnFail: !!parsedArgs.failfast,
    disableLog: !!parsedArgs.quiet
  });
}

if (import.meta.main) {
  main();
}
