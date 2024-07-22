// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import denoJson from "../deno.json" with { type: "json" };

const invalidEntries = [];

for (const [key, value] of Object.entries(denoJson.imports)) {
  if (key.startsWith("@std/") && !/@\^\d+\.\d+\.\d+(?:-.+)?$/.test(value)) {
    invalidEntries.push([key, value]);
  }
}

if (invalidEntries.length > 0) {
  console.log("Invalid entries found in deno.json imports:");
  for (const [key, value] of invalidEntries) {
    console.log(`  ${key}: ${value}`);
  }
  console.log(
    "The range part of std specifier needs to be in the form of ^x.y.z",
  );
  Deno.exit(1);
}
console.log("ok");
