#!/usr/bin/env -S deno run --unstable -A
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// The script for easily running the Node.js script with Deno using Node.JS
// compatibility library (std/node).
import { createRequire } from "./module.ts";
import "./global.ts";

function usage() {
  console.log(`Usage: node [options] <script.js> [arguments]

  Runs Node.js script with Deno using Node.js compatibility library.

Options:
  -h, --help                  print node command line options
`);
}

const opts = {
  help: false,
};

const args = [...Deno.args];
let arg: string | undefined = undefined;
let script: string | undefined = undefined;
// We don't use std/flags to parse the cli options because we need to separate
// options for node/main.ts and the options for the node.js script.
while (arg = args.shift()) {
  if (arg === "-h" || arg === "--help") {
    opts.help = true;
    continue;
  } else if (arg.startsWith("-")) {
    // Ignores unknown option
    continue;
  } else {
    // The first non-option is the main Node.js script
    script = arg;
    // Breaks here to keep the rest of args which will be passed to
    // the main Node.js script
    break;
  }
}

if (opts.help) {
  usage();
  Deno.exit(0);
}

if (!script) {
  usage();
  Deno.exit(1);
}

process.argv = ["", script, ...args];
Object.defineProperty(process.argv, "0", {
  get() {
    return Deno.execPath();
  },
});
const require = createRequire(import.meta.url);
const path = require("path");
const resolved = path.resolve(script);
require(resolved);
