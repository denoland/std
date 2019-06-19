#!/usr/bin/env deno --allow-all
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
const { args, exit } = Deno;
import { install } from "./install.ts";
import { uninstall } from "./uninstall.ts";

function showHelp(): void {
  console.log(`deno installer
  Install remote or local script as executables.

USAGE:
  deno https://deno.land/std/installer/mod.ts install EXE_NAME SCRIPT_URL [FLAGS...]
  deno https://deno.land/std/installer/mod.ts uninstall EXE_NAME

ARGS:
  EXE_NAME  Name for executable
  SCRIPT_URL  Local or remote URL of script to install
  [FLAGS...]  List of flags for script, both Deno permission and script specific
              flag can be used.
`);
}

async function main(): Promise<void> {
  if (args.length < 3) {
    return showHelp();
  }

  if (["-h", "--help"].includes(args[1])) {
    return showHelp();
  }

  if (!["install", "uninstall"].includes(args[1])) {
    return showHelp();
  }

  const command = args[1];
  const moduleName = args[2];
  const moduleUrl = args[3];
  const flags = args.slice(4);

  if (command === "install") {
    if (!moduleUrl) {
      return showHelp();
    }

    try {
      await install(moduleName, moduleUrl, flags);
    } catch (e) {
      console.log(e);
      exit(1);
    }
  } else {
    try {
      await uninstall(moduleName);
    } catch (e) {
      console.log(e);
      exit(1);
    }
  }
}

if (import.meta.main) {
  main();
}
