// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { retry } from "../async/retry.ts";

const projectName = "std-deploy-compat-test";
const branch = Deno.args[0];

if (!branch) {
  console.log("Usage: deno run deploy-check.ts <branch-name>");
  Deno.exit(1);
}

const deployName = branch === "main"
  ? projectName
  : `${projectName}--${branch.replace(/\//g, "-")}`;

await retry(async () => {
  const deployUrl = `https://${deployName}.deno.dev`;
  console.log(`Checking ${deployUrl}`);
  const resp = await fetch(deployUrl);
  await resp.text();
  if (resp.status !== 200) {
    console.log(`${deployUrl} is unavailable`);
    throw new Error("failed");
  }
  console.log(`${deployUrl} is available`);
});
