import { load } from "./load.ts";
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

Deno.test({
  name: "load when multiple files",
  async fn() {
    const p = Deno.run({
      cmd: [
        Deno.execPath(),
        "run",
        "--allow-read",
        "--allow-env",
        path.join(testdataDir, "./app_load_parent.ts"),
      ],
      cwd: testdataDir,
      stdout: "piped",
    });

    const decoder = new TextDecoder();
    const rawOutput = await p.output();
    assertEquals(
      decoder.decode(rawOutput).trim(),
      "hello world",
    );
    p.close();
  },
});
