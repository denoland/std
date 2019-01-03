#!/usr/bin/env deno --allow-net

// This program serves files in the current directory over HTTP.
// TODO Stream responses instead of reading them into memory.
// TODO Add tests like these:
// https://github.com/indexzero/http-server/blob/master/test/http-server-test.js


import { cwd, args } from "deno";
import { fileServer } from "./http.ts";



const serverArgs = args.slice();
let CORSEnabled = false;
// TODO: switch to flags if we later want to add more options
for (let i = 0; i < serverArgs.length; i++) {
  if (serverArgs[i] === "--cors") {
    CORSEnabled = true;
    serverArgs.splice(i, 1);
    break;
  }
}
let currentDir = cwd();
const target = serverArgs[1];
if (target) {
  currentDir = `${currentDir}/${target}`;
}
const addr = `0.0.0.0:${serverArgs[2] || 4500}`;

if (fileServer) {
  fileServer(currentDir, addr, {
    cors: CORSEnabled,
  });
}

