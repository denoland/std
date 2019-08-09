#!/usr/bin/env deno -A
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { parse } from "../flags/mod.ts";
import { glob, walk } from "../fs/mod.ts";
import { runTests } from "./mod.ts";
const { args } = Deno;


const { cwd } = Deno;
const DEFAULT_GLOB = "**/*_test.ts";

async function main(): Promise<void> {
  const parsedArgs = parse(args.slice(1));

  console.log(parsedArgs);

  // TODO: find all files matching _test.js/.ts pattern
  // find all files matching `pattern` glob
  const iterator = walk(cwd(), {
    match: [glob(DEFAULT_GLOB)]
  });

  const foundTestFiles = [];

  for await (const { filename, info } of iterator) {
    // console.log("found path: ", filename);
    foundTestFiles.push(filename);
  }

  console.log("found " + foundTestFiles.length + " matching files");

  for (const filename of foundTestFiles) {
    await import(filename);
  }

  await runTests({
    exitOnFail: !!parsedArgs.exitOnFail,
    disableLog: !!parsedArgs.silent,
  });
}

main();
