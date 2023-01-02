// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import "./global.ts";
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
} from "../testing/asserts.ts";
import { Buffer as BufferModule } from "./buffer.ts";
import processModule from "./process.ts";
import timers from "./timers.ts";

// Definitions for this are quite delicate
// This ensures modifications to the global namespace don't break on TypeScript

// TODO(bartlomieju):
// Deno lint marks globals defined by this module as undefined
// probably gonna change in the future

Deno.test("global is correctly defined", () => {
  // deno-lint-ignore no-undef
  assertStrictEquals(global.Buffer, BufferModule);
  // deno-lint-ignore no-undef
  assertStrictEquals(global.process, process);
});

Deno.test("Buffer is correctly defined", () => {
  //Check that Buffer is defined as a type as well
  type x = Buffer;
  // deno-lint-ignore no-undef
  assertStrictEquals(Buffer, BufferModule);
  // deno-lint-ignore no-undef
  assert(Buffer.from);
  // deno-lint-ignore no-undef
  assertStrictEquals(global.Buffer, BufferModule);
  // deno-lint-ignore no-undef
  assert(global.Buffer.from);
  assertStrictEquals(globalThis.Buffer, BufferModule);
  assert(globalThis.Buffer.from);
  assertStrictEquals(window.Buffer, BufferModule);
  assert(window.Buffer.from);
});

Deno.test("process is correctly defined", () => {
  // deno-lint-ignore no-undef
  assertStrictEquals(process, processModule);
  // deno-lint-ignore no-undef
  assert(process.arch);
  // deno-lint-ignore no-undef
  assertStrictEquals(global.process, processModule);
  // deno-lint-ignore no-undef
  assert(global.process.arch);
  assertStrictEquals(globalThis.process, processModule);
  assert(globalThis.process.arch);
  assertStrictEquals(window.process, processModule);
  assert(window.process.arch);
});

Deno.test("global timers are not Node.js timers", () => {
  assertNotEquals<unknown>(setTimeout, timers.setTimeout);
  assertNotEquals(clearTimeout, timers.clearTimeout);
  assertNotEquals<unknown>(setInterval, timers.setInterval);
  assertNotEquals(clearInterval, timers.clearInterval);
});

Deno.test("timers in `global` object are Node.js timers", () => {
  assertStrictEquals(global.setTimeout, timers.setTimeout);
  assertStrictEquals(global.clearTimeout, timers.clearTimeout);
  assertStrictEquals(global.setInterval, timers.setInterval);
  assertStrictEquals(global.clearInterval, timers.clearInterval);
});

Deno.test("setImmediate is correctly defined", () => {
  // deno-lint-ignore no-undef
  assertStrictEquals(setImmediate, timers.setImmediate);
  // deno-lint-ignore no-undef
  assertStrictEquals(global.setImmediate, timers.setImmediate);
  assertStrictEquals(globalThis.setImmediate, timers.setImmediate);
  assertStrictEquals(window.setImmediate, timers.setImmediate);
});

Deno.test("clearImmediate is correctly defined", () => {
  // deno-lint-ignore no-undef
  assertStrictEquals(clearImmediate, timers.clearImmediate);
  // deno-lint-ignore no-undef
  assertStrictEquals(global.clearImmediate, timers.clearImmediate);
  assertStrictEquals(globalThis.clearImmediate, timers.clearImmediate);
  assertStrictEquals(window.clearImmediate, timers.clearImmediate);
});

// https://github.com/denoland/deno_std/issues/2097
Deno.test("global.ts evaluates synchronously", async () => {
  const tempPath = await Deno.makeTempFile({ suffix: ".ts" });
  try {
    await Deno.writeTextFile(
      tempPath,
      `\
      import "data:application/javascript,import '${
        new URL("global.ts", import.meta.url).href
      }'; console.log(globalThis.async ? 'async' : 'sync')";
      import "data:application/javascript,globalThis.async = true";`,
    );
    const command = new Deno.Command(Deno.execPath(), {
      args: ["run", "--no-check", tempPath],
      stdin: "null",
      stderr: "null",
    });
    const { code, stdout } = await command.output();
    assertEquals(code, 0);
    assertEquals(new TextDecoder().decode(stdout).trim(), "sync");
  } finally {
    await Deno.remove(tempPath).catch(() => {});
  }
});
