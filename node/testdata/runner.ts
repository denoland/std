import { walk } from "../../fs/walk.ts";
import { dirname, fromFileUrl, join } from "../../path/mod.ts";
import { getConfig } from "./common.ts";

const config = await getConfig();

const match = Object.entries(config.tests).reduce(
  (total: RegExp[], [suite, paths]) => {
    paths.forEach((path) => total.push(new RegExp(join(suite, path))));
    return total;
  },
  [],
);

// By default this will assume all tests are inside parallel
const dir = walk(fromFileUrl(new URL(config.suitesFolder, import.meta.url)), {
  includeDirs: false,
  match,
});

for await (const file of dir) {
  const process = Deno.run({
    cwd: dirname(fromFileUrl(import.meta.url)),
    cmd: [
      "deno",
      "run",
      "-A",
      "--unstable",
      "require.ts",
      file.path,
    ],
  });

  const { code } = await process.status();

  if (code === 0) {
    console.log(`${file.path} ....... OK`);
  } else {
    break;
  }
}
