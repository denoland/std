// deno-lint-ignore-file no-undef
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import "./global.ts";
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertThrows,
} from "../testing/asserts.ts";
import { stripColor } from "../fmt/colors.ts";
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
    // TODO(rsp): make sure that the arch strings should be the same in Node and Deno:
    assertEquals(process.arch, Deno.build.arch);
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
    assertThrows(
      () => {
        process.on("uncaughtException", (_err: Error) => {});
      },
      Error,
      "implemented",
    );

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
  name: "[process] stdio",
  async fn() {
    const cwd = path.dirname(path.fromFileUrl(import.meta.url));
    const p = Deno.run({
      cmd: [
        Deno.execPath(),
        "run",
        "--unstable",
        "--quiet",
        "./testdata/process_stdio.ts",
      ],
      cwd,
      stderr: "piped",
      stdin: "piped",
      stdout: "piped",
    });
    p.stdin.write(new TextEncoder().encode("it works?!"));
    p.stdin.write(new TextEncoder().encode("yes!"));
    p.stdin.close();
    const stderr = new TextDecoder().decode(await p.stderrOutput());
    const stdout = new TextDecoder().decode(await p.output());
    assertEquals(
      stderr + stdout,
      "helloworldhelloworldfrom pipereceived:it works?!yes!helloworldhelloworldfrom pipe",
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
