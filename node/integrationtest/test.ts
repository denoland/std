// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { fromFileUrl, join } from "../../path/mod.ts";
import { delay } from "../../async/delay.ts";

const env = {
  DENO_NODE_COMPAT_URL: new URL("../../", import.meta.url).href,
};

Deno.test("integration test of compat mode", {
  ignore: Deno.build.os === "windows",
}, async (t) => {
  const tempDir = await Deno.makeTempDir();
  const opts = { env, cwd: tempDir };
  let hasDocker;
  try {
    await exec("docker help");
    hasDocker = true;
  } catch {
    hasDocker = false;
  }

  await t.step("run express example app", async () => {
    await Deno.writeTextFile(
      join(tempDir, "app.js"),
      `
        import express from "npm:express";
        const app = express();
        app.get("/", (req, res) => res.send("hello"));
        app.listen(3000, async () => {
          const text = await (await fetch("http://localhost:3000")).text();
          if (text === "hello") {
            Deno.exit(0);
          } else {
            console.error(\`Error: Response text is not 'hello': \${text}\`);
            Deno.exit(1);
          }
        });
      `,
    );
    await exec(`deno run --unstable -A app.js`, opts);
  });

  // Runs test only when docker command is available
  if (hasDocker) {
    const pwd = fromFileUrl(new URL(".", import.meta.url));
    await exec(
      `docker run -d --name mysql-test -e MYSQL_ALLOW_EMPTY_PASSWORD=1 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=test -v ${pwd}/testdata/mysql-conf:/etc/mysql/conf.d -v ${pwd}/testdata/mysql-certs:/certs -p 3306:3306 mysql:8.0.18`,
    );
    await t.step("Runs basic mysql2 example", async () => {
      await Deno.copyFile(
        fromFileUrl(new URL("mysql2-example.js", import.meta.url)),
        join(tempDir, "mysql2-example.js"),
      );
      // Wait for the mysql server starting
      // FIXME(kt3k): This is racy. Find a more reliable way to wait for
      // mysql being ready
      await delay(15000);
      await exec(`deno run --unstable -A mysql2-example.js`, opts);
    });
    await exec("docker rm -f mysql-test");
  }

  await Deno.remove(tempDir, { recursive: true });
});

type Opts = Pick<Deno.CommandOptions, "env" | "cwd">;
function exec(cmd: string, opts: Opts = {}) {
  const [command, ...args] = cmd.split(" ");
  return execCmd(command, args, opts);
}
async function execCmd(cmd: string, args: string[], opts: Opts) {
  console.log(`Executing the command: "${args.join(" ")}"`);
  const command = new Deno.Command(cmd, {
    args,
    ...opts,
  });
  const { code, stderr, stdout } = await command.output();
  if (code !== 0) {
    console.log(new TextDecoder().decode(stdout));
    console.log(new TextDecoder().decode(stderr));
    throw new Error(`The command: "${args.join(" ")}" failed`);
  }
}
