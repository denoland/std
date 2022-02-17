import { load } from "./load.ts";
import { assertEquals } from "../testing/asserts.ts";

function clearDenoEnv() {
  Object.keys(Deno.env.toObject()).forEach((key) => Deno.env.delete(key));
}
Deno.test("assign no override", async () => {
  await load(Deno.env, {
    envPath: new URL("./testdata/.env.test", import.meta.url),
    examplePath: new URL("./testdata/.env.example.test", import.meta.url),
    defaultsPath: new URL("./testdata/.env.defaults.test", import.meta.url),
  });
  assertEquals(Deno.env.get("GREETING"), "Hello World");
  assertEquals(Deno.env.get("DEFAULT1"), "Some Default");
  clearDenoEnv();
});
