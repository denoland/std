// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { dirname, extname } from "../path/posix.ts";
import { copy } from "../io/util.ts";
import { lookPath } from "./_lp_windows.ts";

async function installExe(dest: string, src: string) {
  const fsrc = await Deno.open(src);
  const fdest = await Deno.create(dest);
  await copy(fsrc, fdest);
}

async function installBat(dest: string) {
  await Deno.create(dest);
}

async function installProg(dest: string, srcExe: string) {
  await Deno.mkdir(dirname(dest), {
    mode: 0o700,
    recursive: true,
  });
  if (extname(dest).toLowerCase() === ".bat") {
    await installBat(dest);
    return
  }
  await installExe(dest, srcExe);
}

type LookPathTest = {
  rootDir: string,
  PATH: string,
  PATHEXT: string,
  files: string[],
  searchFor: string,
  fails: boolean, // test is expected to fail
};

async function runProg(lpt: LookPathTest, env: string[], ...cmd: string[]): Promise<string> {
  // should Deno.run something with cmd and env?
  return await "";
}