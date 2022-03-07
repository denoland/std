// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { join } from "../../path/mod.ts";
import { assert } from "../../testing/asserts.ts";

const env = {
  DENO_NODE_COMPAT_URL: new URL("../../", import.meta.url).href,
};
const yarnUrl = new URL("./yarn.js", import.meta.url).href;

Deno.test("integration test of compat mode", {
  ignore: Deno.build.os === "windows",
}, async (t) => {
  const tempDir = await Deno.makeTempDir();
  const opts = { env, cwd: tempDir };
  const npmPath = join(tempDir, "node_modules", "npm");
  const gulpPath = join(tempDir, "node_modules", "gulp");
  const expressPath = join(tempDir, "node_modules", "express");

  await t.step("yarn add npm express", async () => {
    // FIXME(kt3k): npm@8.5.3 doesn't work with compat mode
    await exec(`deno run --compat --unstable -A ${yarnUrl} add npm@8.5.2`, opts);
    assert((await Deno.lstat(join(npmPath, "package.json"))).isFile);
    await exec(`deno run --compat --unstable -A ${yarnUrl} add express`, opts);
    assert((await Deno.lstat(join(expressPath, "package.json"))).isFile);
  });

  await t.step("npm install gulp", async () => {
    const npmCli = join(npmPath, "index.js");
    await exec(`deno run --compat --unstable -A ${npmCli} install gulp`, opts);
    const stat = await Deno.lstat(join(gulpPath, "package.json"));
    assert(stat.isFile);
  });

  await t.step("run express example app", async () => {
    await Deno.writeTextFile(
      join(tempDir, "app.js"),
      `
    require("express")()
      .get("/", (req, res) => res.send("hello"))
      .listen(3000, async () => {
        const text = await (await fetch("http://localhost:3000")).text();
        if (text === "hello") {
          process.exit(0);
        } else {
          console.error(\`Error: Response text is not 'hello': $\{text}\`);
          process.exit(1);
        }
      });
    `,
    );
    await exec(`deno run --compat --unstable -A app.js`, opts);
  });

  await Deno.remove(tempDir, { recursive: true });
});

type Opts = Pick<Deno.RunOptions, "env" | "cwd">;
function exec(cmd: string, opts: Opts = {}) {
  return execCmd(cmd.split(" "), opts);
}
async function execCmd(cmd: string[], opts: Opts) {
  console.log(`Executing the command: "${cmd.join(" ")}"`);
  const p = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
    ...opts,
  });
  const [status, output, stderrOutput] = await Promise.all([
    p.status(),
    p.output(),
    p.stderrOutput(),
  ]);
  p.close();
  if (status.code !== 0) {
    console.log(new TextDecoder().decode(output));
    console.log(new TextDecoder().decode(stderrOutput));
    throw new Error(`The command: "${cmd.join(" ")}" failed`);
  }
}
