// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "../testing/asserts.ts";

import * as path from "../path/mod.ts";
import Module, { createRequire } from "./module.ts";
import nodeMods from "./module_all.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, path.join("_fs", "testdata"));

const require = createRequire(import.meta.url);

Deno.test("requireSuccess", function () {
  // Relative to import.meta.url
  const result = require("./_module/cjs/cjs_a.js");
  assert("helloA" in result);
  assert("helloB" in result);
  assert("C" in result);
  assert("leftPad" in result);
  assertEquals(result.helloA(), "A");
  assertEquals(result.helloB(), "B");
  assertEquals(result.C, "C");
  assertEquals(result.leftPad("pad", 4), " pad");
});

Deno.test("requireCycle", function () {
  const resultA = require("./_module/cjs/cjs_cycle_a");
  const resultB = require("./_module/cjs/cjs_cycle_b");
  assert(resultA);
  assert(resultB);
});

Deno.test("requireBuiltin", function () {
  const fs = require("fs");
  assert("readFileSync" in fs);
  const { readFileSync, isNull, extname } = require(
    "./_module/cjs/cjs_builtin",
  );

  const testData = path.relative(
    Deno.cwd(),
    path.join(testdataDir, "hello.txt"),
  );
  assertEquals(
    readFileSync(testData, { encoding: "utf8" }),
    "hello world",
  );
  assert(isNull(null));
  assertEquals(extname("index.html"), ".html");
});

Deno.test("requireIndexJS", function () {
  const { isIndex } = require("./_module/cjs");
  assert(isIndex);
});

Deno.test("requireWithNodePrefix", function () {
  const osWithPrefix = require("node:os");
  const os = require("os");
  assert(osWithPrefix === os);
  assert(osWithPrefix.arch);
  assert(typeof osWithPrefix.arch() == "string");
});

Deno.test("requireNodeOs", function () {
  const os = require("os");
  assert(os.arch);
  assert(typeof os.arch() == "string");
});

Deno.test("requireStack", function () {
  const { hello } = require("./_module/cjs/cjs_throw");
  try {
    hello();
  } catch (e) {
    assert(e instanceof Error);
    assert(e.stack);
    assertStringIncludes(e.stack, "/_module/cjs/cjs_throw.js");
  }
});

Deno.test("requireFileInSymlinkDir", () => {
  const { C } = require("./_module/cjs/dir");
  assertEquals(C, "C");
});

Deno.test("requireModuleWithConditionalExports", () => {
  const { red, blue } = require("./_module/cjs/cjs_conditional_exports");
  assert(typeof red === "function");
  assert(typeof blue === "function");
});

const SUPPORTED_NODE_MODULES = Object.keys(nodeMods);

Deno.test("requireNodeJsNativeModules", () => {
  // Checks these exist and don't throw.
  for (const name of SUPPORTED_NODE_MODULES) {
    require(name);
  }
});

Deno.test("native modules are extensible", () => {
  const randomKey = "random-key";
  const randomValue = "random-value";
  for (const name of SUPPORTED_NODE_MODULES) {
    const mod = require(name);
    Object.defineProperty(mod, randomKey, {
      value: randomValue,
      configurable: true,
    });
    assertEquals(mod[randomKey], randomValue);
    delete mod[randomKey];
    assertEquals(mod[randomKey], undefined);
  }
});

Deno.test("Require file with shebang", () => {
  require("./testdata/shebang.js");
});

Deno.test("EventEmitter is exported correctly", () => {
  const EventEmitter = require("events");
  assertEquals(EventEmitter, EventEmitter.EventEmitter);
});

Deno.test("Require .mjs", () => {
  assertThrows(
    () => require("./testdata/inspect.mjs"),
    Error,
    "Importing ESM module:",
  );
});

Deno.test("requireErrorInEval", async function () {
  const cwd = path.dirname(path.fromFileUrl(import.meta.url));

  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--unstable",
      "--allow-read",
      "./_module/cjs/test_cjs_import.js",
    ],
    cwd,
  });
  const { stderr, stdout } = await command.output();

  const decoder = new TextDecoder();
  const outputError = decoder.decode(stderr);

  assert(!stdout.length);
  assert(
    outputError.includes(
      'To load an ES module, set "type": "module" in the package.json or use the .mjs extension.',
    ),
  );
  assert(
    outputError.includes(
      "SyntaxError: Cannot use import statement outside a module",
    ),
  );
});

Deno.test("requireCjsWithDynamicImport", function () {
  require("./_module/cjs/cjs_with_dynamic_import");
});

Deno.test("requireWithImportsExports", function () {
  require("./_module/cjs/cjs_imports_exports");
});

Deno.test("module has proper members", function () {
  const module = require("module");

  assert(module._cache);
  assert(module._extensions);
  assert(typeof module._findPath == "function");
  assert(typeof module._initPaths == "function");
  assert(typeof module._load == "function");
  assert(typeof module._nodeModulePaths == "function");
  assert(module._pathCache);
  assert(typeof module._preloadModules == "function");
  assert(typeof module._resolveFilename == "function");
  assert(typeof module._resolveLookupPaths == "function");
  assert(module.builtinModules);
  assert(typeof module.createRequire == "function");
  assert(module.globalPaths);
  assert(module.Module === Module);
  assert(typeof module.wrap == "function");
});

Deno.test("a module can have its own timers declarations", function () {
  require("./_module/cjs/cjs_declare_timers");
});

Deno.test("require in a web worker", async () => {
  const code = `\
    import { createRequire } from "${new URL("module.ts", import.meta.url)}";
    const require = createRequire("${import.meta.url}");
    const result = require("./_module/cjs/cjs_a.js");
    if (result.helloA() != "A") {
      throw new Error("assertion failed in worker");
    }
    postMessage(null);
  `;
  const worker = new Worker(
    `data:application/javascript;base64,${btoa(code)}`,
    { type: "module" },
  );
  await new Promise((resolve, reject) => {
    worker.addEventListener("message", resolve);
    worker.addEventListener("error", reject);
  });
  worker.terminate();
});

Deno.test("createRequire with http(s):// URL  throws with correct error message", () => {
  assertThrows(
    () => createRequire("http://example.com/foo.js"),
    Error,
    "createRequire only supports 'file://' URLs for the 'filename' parameter. Received 'http://example.com/foo.js'",
  );
  assertThrows(
    () => createRequire("https://example.com/foo.js"),
    Error,
    "createRequire only supports 'file://' URLs for the 'filename' parameter. Received 'https://example.com/foo.js'",
  );
});

Deno.test("require Node-API module", {
  ignore: Deno.build.arch === "aarch64" && Deno.build.os === "darwin",
}, () => {
  const require = createRequire(import.meta.url);
  if (Deno.build.os === "windows") {
    // TODO(kt3k): Add lib binary for windows from 1_hello_world example of
    // https://github.com/nodejs/node-addon-examples
  }
  if (Deno.build.os === "linux") {
    // TODO(kt3k): Add lib binary for linux from 1_hello_world example of
    // https://github.com/nodejs/node-addon-examples
  }
  if (Deno.build.os === "darwin") {
    const str = require("./testdata/libhello_darwin.node").hello();
    assertEquals(str, "world");
  }
});
