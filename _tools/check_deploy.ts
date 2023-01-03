// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { retry } from "../async/retry.ts";

const projectName = "std-deploy-compat-test";
const branch = Deno.args[0];

if (!branch) {
  console.log("Usage: deno run deploy-check.ts <branch-name>");
  Deno.exit(1);
}

// branch name will be transformed by the following rules:
// - separators (/, ., or _) are replaced to "-"
// - non alphanumeric chars are removed (except "-")
// - truncated to 26 chars
// - trim the last "-"s
const branchId = branch
  .replace(/[_\/.]/g, "-")
  .replace(/[^a-zA-Z0-9-]/g, "")
  .slice(0, 26)
  .replace(/-+$/, "");

const deployName = branch === "main"
  ? projectName
  : `${projectName}--${branchId}`;

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
