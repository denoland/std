import { load, loadSync } from "./load.ts";
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";

function clearDenoEnv() {
  Object.keys(Deno.env.toObject()).forEach((key) => Deno.env.delete(key));
}

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("load", async () => {
  await load(Deno.env, {
    envPath: path.join(testdataDir, ".env.test"),
    examplePath: path.join(testdataDir, ".env.example.test"),
    defaultsPath: path.join(testdataDir, ".env.defaults.test"),
  });
  assertEquals(Deno.env.get("GREETING"), "Hello World");
  assertEquals(Deno.env.get("DEFAULT1"), "Some Default");
  clearDenoEnv();
});

Deno.test("loadSync", async () => {
  await loadSync(Deno.env, {
    envPath: "./dotenv/testdata/.env.test",
    examplePath: "./dotenv/testdata/.env.example.test",
    defaultsPath: "./dotenv/testdata/.env.defaults.test",
  });
  assertEquals(Deno.env.get("GREETING"), "Hello World");
  assertEquals(Deno.env.get("DEFAULT1"), "Some Default");
  clearDenoEnv();
});
