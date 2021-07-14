#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-env
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import * as base64 from "../../encoding/base64.ts";
import * as hash from "../mod.ts";

const home = Deno.env.get("HOME");
const root = new URL(".", import.meta.url).pathname;

// Run in the same directory as this script is located.
if (new URL(import.meta.url).protocol === "file:") {
  Deno.chdir(root);
} else {
  console.error("build.ts can only be run locally (from a file: URL).");
  Deno.exit(1);
}

// Format the Rust code.
if (
  !((await Deno.run({
    cmd: [
      "cargo",
      "fmt",
    ],
  }).status()).success)
) {
  console.error(`Failed to format the Rust code.`);
  Deno.exit(1);
}

// Compile the Rust code to WASM.
if (
  !((await Deno.run({
    cmd: [
      "cargo",
      "build",
      "--release",
      "--target",
      "wasm32-unknown-unknown",
    ],
    env: {
      // eliminate some potential sources of non-determinism
      SOURCE_DATE_EPOCH: "1600000000",
      TZ: "UTC",
      LC_ALL: "C",
      RUSTFLAGS: `--remap-path-prefix=${root}=. --remap-path-prefix=${home}=~`,
    },
  }).status()).success)
) {
  console.error(`Failed to compile the Rust code to WASM.`);
  Deno.exit(1);
}

// Generate JavaScript bindings from WASM.
if (
  !((await Deno.run({
    cmd: [
      "wasm-bindgen",
      "./target/wasm32-unknown-unknown/release/deno_hash.wasm",
      "--target",
      "deno",
      "--weak-refs",
      "--out-dir",
      "./out/",
    ],
  }).status()).success)
) {
  console.error(`Failed to generate JavaScript bindings from WASM.`);
  Deno.exit(1);
}

// Encode WASM binary as a TypeScript module.
const generatedWasm = await Deno.readFile("./out/deno_hash_bg.wasm");

// Format WASM binary size with _ thousands separators for human readablity,
// so that any changes in size will be clear in diffs.
const formattedWasmSize = generatedWasm.length.toString().padStart(
  Math.ceil(generatedWasm.length.toString().length / 3) * 3,
).replace(/...\B/g, "$&_").trim();

// Generate a hash of the WASM in the format required by subresource integrity.
const wasmIntegrity = `sha384-${
  base64.encode(hash.digest("sha384", generatedWasm))
}`;

const wasmJs = `
import * as base64 from "../../encoding/base64.ts";

export const size = ${formattedWasmSize};
export const type = "application/wasm";
export const integrity = ${JSON.stringify(wasmIntegrity)};
export const bytes = base64.decode("\\\n${
  base64.encode(generatedWasm).replace(/.{78}/g, "$&\\\n")
}\\\n");

export default bytes;
`;

// Modify the generated WASM bindings, replacing the runtime fetching of the
// WASM binary file with a static TypeScript import of the copy we encoded
// above. This eliminates the need for net or read permissions.
const generatedScript = await Deno.readTextFile("./out/deno_hash.js");
const bindingsJs = `
// deno-lint-ignore-file
import wasmBytes from "./wasm_file.ts";

${
  generatedScript.replace(
    /^const file =.*?;\nconst wasmFile =.*?;\nconst wasmModule =.*?;\n/sm,
    `const wasmModule = new WebAssembly.Module(wasmBytes);`,
  )
}

export const _wasm = wasm;
`;

await Deno.writeTextFile("./wasm_file.ts", wasmJs);
await Deno.writeTextFile("./wasm_bindings.js", bindingsJs);

// Format the generated files.
if (
  !(await Deno.run({
    cmd: [
      "deno",
      "fmt",
      "./wasm_file.ts",
      "./wasm_bindings.js",
    ],
  }).status()).success
) {
  console.error(
    `Failed to format generated code.`,
  );
  Deno.exit(1);
}
