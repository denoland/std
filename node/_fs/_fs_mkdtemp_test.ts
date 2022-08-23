// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assert, assertRejects, assertThrows } from "../../testing/asserts.ts";
import { mkdtemp, mkdtempSync } from "./_fs_mkdtemp.ts";
import { existsSync } from "./_fs_exists.ts";
import { env } from "../process.ts";
import { isWindows } from "../../_util/os.ts";
import { promisify } from "../internal/util.mjs";

const prefix = isWindows ? env.TEMP + "\\" : (env.TMPDIR || "/tmp") + "/";
const doesNotExists = "/does/not/exists/";
const options = { encoding: "ascii" };
const badOptions = { encoding: "bogus" };

const mkdtempP = promisify(mkdtemp);

Deno.test({
  name: "mkdtemp",
  fn: async () => {
    const directory = await mkdtempP(prefix);
    assert(existsSync(directory));
    Deno.removeSync(directory);
  },
});

Deno.test({
  name: "mkdtemp (does not exists)",
  fn: async () => {
    await assertRejects(() => mkdtempP(doesNotExists));
  },
});

Deno.test({
  name: "mkdtemp (with options)",
  fn: async () => {
    const directory = await mkdtempP(prefix, options);
    assert(existsSync(directory));
    Deno.removeSync(directory);
  },
});

Deno.test({
  name: "mkdtemp (with bad options)",
  fn: async () => {
    await assertRejects(() => mkdtempP(prefix, badOptions));
  },
});

Deno.test({
  name: "mkdtempSync",
  fn: () => {
    const directory = mkdtempSync(prefix);
    const dirExists = existsSync(directory);
    Deno.removeSync(directory);
    assert(dirExists);
  },
});

Deno.test({
  name: "mkdtempSync (does not exists)",
  fn: () => {
    assertThrows(() => mkdtempSync(doesNotExists));
  },
});

Deno.test({
  name: "mkdtempSync (with options)",
  fn: () => {
    const directory = mkdtempSync(prefix, options);
    const dirExists = existsSync(directory);
    Deno.removeSync(directory);
    assert(dirExists);
  },
});

Deno.test({
  name: "mkdtempSync (with bad options)",
  fn: () => {
    assertThrows(() => mkdtempSync(prefix, badOptions));
  },
});
