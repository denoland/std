// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import * as path from "../path/mod.ts";
import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import {
  readConfigFile,
  readConfigFileSync,
  resolveConfigFilePath,
} from "./config_file.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testData = path.resolve(moduleDir, "testdata");
Deno.test({
  name: "resolveConfigFilePath",
  async fn(t) {
    await t.step({
      name: "dir json",
      fn() {
        const configFilePath = resolveConfigFilePath(
          path.join(testData, "json"),
        );
        assertEquals(configFilePath, path.join(testData, "json/deno.json"));
      },
    });
    await t.step({
      name: "dir jsonc",
      fn() {
        const configFilePath = resolveConfigFilePath(
          path.join(testData, "jsonc"),
        );
        assertEquals(configFilePath, path.join(testData, "jsonc/deno.jsonc"));
      },
    });
    await t.step({
      name: "parent dir json",
      fn() {
        const configFilePath = resolveConfigFilePath(
          path.join(testData, "parent/child"),
        );
        assertEquals(configFilePath, path.join(testData, "parent/deno.json"));
      },
    });
    await t.step({
      name: "out of cwd scope",
      fn() {
        const configFilePath = resolveConfigFilePath("/other/scope");
        assertEquals(configFilePath, null);
      },
    });
  },
});

Deno.test({
  name: "readConfigFile",
  async fn(t) {
    await t.step({
      name: "json",
      async fn() {
        const data = await readConfigFile(
          path.join(testData, "json/deno.json"),
        );
        assertEquals(data, { compilerOptions: {} });
      },
    });
    await t.step({
      name: "jsonc",
      async fn() {
        const data = await readConfigFile(
          path.join(testData, "jsonc/deno.jsonc"),
        );
        assertEquals(data, { compilerOptions: {} });
      },
    });
    await t.step({
      name: "not found",
      async fn() {
        await assertRejects(async () =>
          await readConfigFile(path.join(testData, "notFound"))
        );
      },
    });
  },
});

Deno.test({
  name: "readConfigFileSync",
  async fn(t) {
    await t.step({
      name: "json",
      fn() {
        const data = readConfigFileSync(path.join(testData, "json/deno.json"));
        assertEquals(data, { compilerOptions: {} });
      },
    });
    await t.step({
      name: "jsonc",
      fn() {
        const data = readConfigFileSync(
          path.join(testData, "jsonc/deno.jsonc"),
        );
        assertEquals(data, { compilerOptions: {} });
      },
    });
    await t.step({
      name: "not found",
      fn() {
        assertThrows(() => readConfigFileSync(path.join(testData, "notFound")));
      },
    });
  },
});
