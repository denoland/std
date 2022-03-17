// deno-lint-ignore-file no-undef
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import "./global.ts";
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertThrows,
} from "../testing/asserts.ts";
import { stripColor } from "../fmt/colors.ts";
import { deferred } from "../async/deferred.ts";
import * as path from "../path/mod.ts";
import { delay } from "../async/delay.ts";
import { env } from "./process.ts";

Deno.test({
  name: "process.cwd and process.chdir success",
  fn() {
    assertEquals(process.cwd(), Deno.cwd());

    const currentDir = Deno.cwd();

    const tempDir = Deno.makeTempDirSync();
    process.chdir(tempDir);
    assertEquals(
      Deno.realPathSync(process.cwd()),
      Deno.realPathSync(tempDir),
    );

    process.chdir(currentDir);
  },
});

Deno.test({
  name: "process.chdir failure",
  fn() {
    assertThrows(
      () => {
        process.chdir("non-existent-directory-name");
      },
      Deno.errors.NotFound,
      "file",
      // On every OS Deno returns: "No such file" except for Windows, where it's:
      // "The system cannot find the file specified. (os error 2)" so "file" is
      // the only common string here.
    );
  },
});

Deno.test({
  name: "process.version",
  fn() {
    assertEquals(typeof process, "object");
    assertEquals(typeof process.version, "string");
    assertEquals(typeof process.versions, "object");
    assertEquals(typeof process.versions.node, "string");
    assertEquals(typeof process.versions.v8, "string");
    assertEquals(typeof process.versions.uv, "string");
    assertEquals(typeof process.versions.zlib, "string");
    assertEquals(typeof process.versions.brotli, "string");
    assertEquals(typeof process.versions.ares, "string");
    assertEquals(typeof process.versions.modules, "string");
    assertEquals(typeof process.versions.nghttp2, "string");
    assertEquals(typeof process.versions.napi, "string");
    assertEquals(typeof process.versions.llhttp, "string");
    assertEquals(typeof process.versions.openssl, "string");
    assertEquals(typeof process.versions.cldr, "string");
    assertEquals(typeof process.versions.icu, "string");
    assertEquals(typeof process.versions.tz, "string");
    assertEquals(typeof process.versions.unicode, "string");
    // These two are not present in `process.versions` in Node, but we
    // add them anyway
    assertEquals(typeof process.versions.deno, "string");
    assertEquals(typeof process.versions.typescript, "string");
  },
});

Deno.test({
  name: "process.platform",
  fn() {
    assertEquals(typeof process.platform, "string");
  },
});

Deno.test({
  name: "process.mainModule",
  fn() {
    assertEquals(process.mainModule, undefined);
    // Check that it is writable
    process.mainModule = "foo";
    assertEquals(process.mainModule, "foo");
  },
});

Deno.test({
  name: "process.arch",
  fn() {
    assertEquals(typeof process.arch, "string");
    if (Deno.build.arch == "x86_64") {
      assertEquals(process.arch, "x64");
    } else if (Deno.build.arch == "aarch64") {
      assertEquals(process.arch, "arm64");
    } else {
      throw new Error("unreachable");
    }
  },
});

Deno.test({
  name: "process.pid",
  fn() {
    assertEquals(typeof process.pid, "number");
    assertEquals(process.pid, Deno.pid);
  },
});

Deno.test({
  name: "process.on",
  async fn() {
    assertEquals(typeof process.on, "function");

    let triggered = false;
    process.on("exit", () => {
      triggered = true;
    });
    process.emit("exit");
    assert(triggered);

    const cwd = path.dirname(path.fromFileUrl(import.meta.url));

    const p = Deno.run({
      cmd: [
        Deno.execPath(),
        "run",
        "--quiet",
        "--unstable",
        "./testdata/process_exit.ts",
      ],
      cwd,
      stdout: "piped",
    });

    const decoder = new TextDecoder();
    const rawOutput = await p.output();
    assertEquals(
      stripColor(decoder.decode(rawOutput).trim()),
      "1\n2",
    );
    p.close();
  },
});

Deno.test({
  name: "process.on signal",
  ignore: Deno.build.os == "windows",
  async fn() {
    const promise = deferred();
    let c = 0;
    const listener = () => {
      c += 1;
    };
    process.on("SIGINT", listener);
    setTimeout(async () => {
      // Sends SIGINT 3 times.
      for (const _ of Array(3)) {
        await delay(20);
        Deno.kill(Deno.pid, "SIGINT");
      }
      await delay(20);
      Deno.removeSignalListener("SIGINT", listener);
      promise.resolve();
    });
    await promise;
    assertEquals(c, 3);
  },
});

Deno.test({
  name: "process.off signal",
  ignore: Deno.build.os == "windows",
  async fn() {
    const promise = deferred();
    let c = 0;
    const listener = () => {
      c += 1;
      process.off("SIGINT", listener);
    };
    process.on("SIGINT", listener);
    setTimeout(async () => {
      // Sends SIGINT 3 times.
      for (const _ of Array(3)) {
        await delay(20);
        Deno.kill(Deno.pid, "SIGINT");
      }
      await delay(20);
      promise.resolve();
    });
    await promise;
    assertEquals(c, 1);
  },
});

Deno.test({
  name: "process.on SIGBREAK doesn't throw",
  ignore: Deno.build.os == "windows",
  fn() {
    const listener = () => {};
    process.on("SIGBREAK", listener);
    process.off("SIGBREAK", listener);
  },
});

Deno.test({
  name: "process.argv",
  fn() {
    assert(Array.isArray(process.argv));
    assert(
      process.argv[0].match(/[^/\\]*deno[^/\\]*$/),
      "deno included in the file name of argv[0]",
    );
    assertEquals(
      process.argv[1],
      path.fromFileUrl(Deno.mainModule),
    );
    // argv supports array methods.
    assert(Array.isArray(process.argv.slice(2)));
    assertEquals(process.argv.indexOf(Deno.execPath()), 0);
    assertEquals(process.argv.indexOf(path.fromFileUrl(Deno.mainModule)), 1);
  },
});

Deno.test({
  name: "process.execArgv",
  fn() {
    assert(Array.isArray(process.execArgv));
    assert(process.execArgv.length == 0);
    // execArgv supports array methods.
    assert(Array.isArray(process.argv.slice(0)));
    assertEquals(process.argv.indexOf("foo"), -1);
  },
});

Deno.test({
  name: "process.env",
  fn() {
    Deno.env.set("HELLO", "WORLD");

    assertObjectMatch(process.env, Deno.env.toObject());

    assertEquals(typeof (process.env.HELLO), "string");
    assertEquals(process.env.HELLO, "WORLD");

    assertEquals(typeof env.HELLO, "string");
    assertEquals(env.HELLO, "WORLD");

    assert(Object.getOwnPropertyNames(process.env).includes("HELLO"));
    assert(Object.keys(process.env).includes("HELLO"));

    assert(Object.prototype.hasOwnProperty.call(process.env, "HELLO"));
    assert(
      !Object.prototype.hasOwnProperty.call(
        process.env,
        "SURELY_NON_EXISTENT_VAR",
      ),
    );
  },
});

Deno.test({
  name: "process.stdin",
  fn() {
    assertEquals(process.stdin.fd, Deno.stdin.rid);
    assertEquals(process.stdin.isTTY, Deno.isatty(Deno.stdin.rid));
  },
});

Deno.test({
  name: "process.stdout",
  fn() {
    assertEquals(process.stdout.fd, Deno.stdout.rid);
    const isTTY = Deno.isatty(Deno.stdout.rid);
    assertEquals(process.stdout.isTTY, isTTY);
    const consoleSize = isTTY ? Deno.consoleSize(Deno.stdout.rid) : undefined;
    assertEquals(process.stdout.columns, consoleSize?.columns);
    assertEquals(process.stdout.rows, consoleSize?.rows);
    assertEquals(
      `${process.stdout.getWindowSize()}`,
      `${consoleSize && [consoleSize.columns, consoleSize.rows]}`,
    );
  },
});

Deno.test({
  name: "process.stderr",
  fn() {
    assertEquals(process.stderr.fd, Deno.stderr.rid);
    const isTTY = Deno.isatty(Deno.stderr.rid);
    assertEquals(process.stderr.isTTY, isTTY);
    const consoleSize = isTTY ? Deno.consoleSize(Deno.stderr.rid) : undefined;
    assertEquals(process.stderr.columns, consoleSize?.columns);
    assertEquals(process.stderr.rows, consoleSize?.rows);
    assertEquals(
      `${process.stderr.getWindowSize()}`,
      `${consoleSize && [consoleSize.columns, consoleSize.rows]}`,
    );
  },
});

Deno.test({
  name: "process.nextTick",
  async fn() {
    let withoutArguments = false;
    process.nextTick(() => {
      withoutArguments = true;
    });

    const expected = 12;
    let result;
    process.nextTick((x: number) => {
      result = x;
    }, 12);

    await delay(10);
    assert(withoutArguments);
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "process.hrtime",
  // TODO(kt3k): Enable this test
  ignore: true,
  fn() {
    const [sec0, nano0] = process.hrtime();
    // seconds and nano seconds are positive integers.
    assert(sec0 > 0);
    assert(Number.isInteger(sec0));
    assert(nano0 > 0);
    assert(Number.isInteger(nano0));

    const [sec1, nano1] = process.hrtime();
    // the later call returns bigger value
    assert(sec1 >= sec0);
    assert(nano1 > nano0);

    const [sec2, nano2] = process.hrtime([sec1, nano1]);
    // the difference of the 2 calls is a small positive value.
    assertEquals(sec2, 0);
    assert(nano2 > 0);
  },
});

Deno.test({
  name: "process.hrtime.bigint",
  fn() {
    const time = process.hrtime.bigint();
    assertEquals(typeof time, "bigint");
    assert(time > 0n);
  },
});

Deno.test("process.on, process.off, process.removeListener doesn't throw on unimplemented events", () => {
  const events = [
    "beforeExit",
    "disconnect",
    "message",
    "multipleResolves",
    "rejectionHandled",
    "uncaughtException",
    "uncaughtExceptionMonitor",
    "unhandledRejection",
  ];
  const handler = () => {};
  events.forEach((ev) => {
    process.on(ev, handler);
    process.off(ev, handler);
    process.on(ev, handler);
    process.removeListener(ev, handler);
  });
});

Deno.test("process.memoryUsage()", () => {
  const mem = process.memoryUsage();
  assert(typeof mem.rss === "number");
  assert(typeof mem.heapTotal === "number");
  assert(typeof mem.heapUsed === "number");
  assert(typeof mem.external === "number");
  assert(typeof mem.arrayBuffers === "number");
  assertEquals(mem.arrayBuffers, 0);
});

Deno.test("process.memoryUsage.rss()", () => {
  const rss = process.memoryUsage.rss();
  assert(typeof rss === "number");
});

Deno.test("process in worker", async () => {
  const promise = deferred();

  const worker = new Worker(
    new URL("./testdata/process_worker.ts", import.meta.url).href,
    { type: "module", deno: true },
  );
  worker.addEventListener("message", (e) => {
    assertEquals(e.data, "hello");
    promise.resolve();
  });

  await promise;
  worker.terminate();
});

Deno.test("process.exitCode", () => {
  assert(process.exitCode === undefined);
  process.exitCode = 127;
  assert(process.exitCode === 127);
});

Deno.test("process.config", () => {
  assert(process.config !== undefined);
  assert(process.config.target_defaults !== undefined);
  assert(process.config.variables !== undefined);
});

Deno.test("process._exiting", () => {
  assert(process._exiting === false);
});

Deno.test("process.execPath", () => {
  assertEquals(process.execPath, process.argv[0]);
});

Deno.test({
  name: "process.exit",
  async fn() {
    const cwd = path.dirname(path.fromFileUrl(import.meta.url));

    const p = Deno.run({
      cmd: [
        Deno.execPath(),
        "run",
        "--quiet",
        "--unstable",
        "./testdata/process_exit2.ts",
      ],
      cwd,
      stdout: "piped",
    });

    const decoder = new TextDecoder();
    const rawOutput = await p.output();
    assertEquals(
      stripColor(decoder.decode(rawOutput).trim()),
      "exit",
    );
    p.close();
  },
});
