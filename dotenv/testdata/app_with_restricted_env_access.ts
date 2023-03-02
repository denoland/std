import { load } from "../mod.ts";

try {
  const conf = await load({
    restrictEnvAccessTo: ["GREETING"],
  });

  console.log(JSON.stringify(conf, null, 2));
} catch (e) {
  console.log((e as Error).message);
}
