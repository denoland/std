// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Based on `quote_cmd_arg()` function from https://github.com/libuv/libuv/blob/30ff5bf2161257921f3a3ce5655804f7cb282aa9/src/win/process.c
 * Copyright Joyent, Inc. and other Node contributors. All rights reserved. MIT license.
 * @param arg 
 */
export function quoteCmdArg(arg: string): string {
  if (arg.length === 0) {
    /* Need double quotation for empty argument */
    return '""';
  }

  if (!/ |\t|\"/g.test(arg)) {
    /* No quotation needed */
    return arg;
  }

  if (!/\"|\\/g.test(arg)) {
    /*
     * No embedded double quotes or backlashes, so I can just wrap
     * quote marks around the whole thing.
     */
    return '"' + arg + '"';
  }

  /*
   * Expected input/output:
   *   input : hello"world
   *   output: "hello\"world"
   *   input : hello""world
   *   output: "hello\"\"world"
   *   input : hello\world
   *   output: hello\world
   *   input : hello\\world
   *   output: hello\\world
   *   input : hello\"world
   *   output: "hello\\\"world"
   *   input : hello\\"world
   *   output: "hello\\\\\"world"
   *   input : hello world\
   *   output: "hello world\\"
   */
  let buf = "";
  let quoteHit = true;
  for (let i = arg.length; i > 0; i--) {
    buf += arg[i - 1];
    if (quoteHit && arg[i - 1] === "\\") {
      buf += "\\";
    } else if (arg[i - 1] === '"') {
      buf += "\\";
      quoteHit = true;
    } else {
      quoteHit = false;
    }
  }
  return '"' + Array.from(buf).reverse().join("") + '"';
}
