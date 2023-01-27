import { loadSync } from "../mod.ts";

try {
  const conf = loadSync({
    restrictEnvAccessTo: ["GREETING"],
  });

  console.log(JSON.stringify(conf, null, 2));
} catch (e) {
  console.log((e as Error).message);
}
