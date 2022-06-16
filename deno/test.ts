import * as path from "../path/mod.ts";
import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import { loadConfigFile, loadConfigFileSync } from "./loadConfigFile.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testData = path.resolve(moduleDir, "testdata");

Deno.test({
  name: "loadConfigFile",
  async fn(t) {
    await t.step({
      name: "json",
      async fn() {
        const data = await loadConfigFile(path.join(testData, "json"));
        assertEquals(data, { compilerOptions: {} });
      },
    });
    await t.step({
      name: "jsonc",
      async fn() {
        const data = await loadConfigFile(path.join(testData, "jsonc"));
        assertEquals(data, { compilerOptions: {} });
      },
    });
    await t.step({
      name: "not found",
      async fn() {
        await assertRejects(async () =>
          await loadConfigFile(path.join(testData, "notFound"))
        );
      },
    });
  },
});

Deno.test({
  name: "loadConfigFileSync",
  async fn(t) {
    await t.step({
      name: "json",
      fn() {
        const data = loadConfigFileSync(path.join(testData, "json"));
        assertEquals(data, { compilerOptions: {} });
      },
    });
    await t.step({
      name: "jsonc",
      fn() {
        const data = loadConfigFileSync(path.join(testData, "jsonc"));
        assertEquals(data, { compilerOptions: {} });
      },
    });
    await t.step({
      name: "not found",
      fn() {
        assertThrows(() => loadConfigFileSync(path.join(testData, "notFound")));
      },
    });
  },
});
