// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// usage: deno run -A --unstable node/_tools/vendor_readable_stream.ts
const sourceUrl =
  "https://esm.sh/v96/readable-stream@4.2.0/es2022/readable-stream.js";
const header =
  `// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// deno-fmt-ignore-file
// deno-lint-ignore-file
import { nextTick } from "./_next_tick.ts";
import { stdio } from "./_process/stdio.mjs";

`;
const outputFile = new URL("../_stream.mjs", import.meta.url).pathname;
const endMarker = "/* End esm.sh bundle */";

// Download the readable-stream module.
const res = await fetch(sourceUrl);
let src = await res.text();

// Remove the AbortController fallback code since AbortController always
// exists in Deno.
src = src.replaceAll(/import { AbortController as.+?;/g, "");
src = src.replaceAll("||__abort_controller$AbortController", "");

// Replace Node.js core module imports with Deno std modules.
src = src.replaceAll(/"\/v\d+\/node_buffer.js"/g, '"./buffer.ts"');
src = src.replaceAll(/"\/v\d+\/string_decoder.+?"/g, '"./string_decoder.ts"');
src = src.replaceAll(/"\/v\d+\/events@.+?"/g, '"./events.ts"');

// Replace import of the Node.js process object with the APIs that are actually
// used to avoid issues with circular imports.
src = src.replaceAll(
  /import __process\$ from "\/v\d+\/process@.+?";/g,
  "const __process$ = { nextTick, stdio };",
);

// Get any additional code from the end of the current file.
const current = Deno.readTextFileSync(outputFile);
const trailer = current.split(endMarker)[1] ?? "";

// Prepend copyrights, Deno tooling directives, and necessary imports and make
// sure any code at the end of the file is maintained.
src = header + src + endMarker + trailer;

// Update the local file.
Deno.writeTextFileSync(outputFile, src);
