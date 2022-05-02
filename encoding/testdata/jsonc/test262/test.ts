// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { walk } from "../../../../fs/mod.ts";
import { fromFileUrl } from "../../../../path/mod.ts";

// Ignore these files as they are irrelevant to the jsonc parser.
const ignoreFile = new Set([
  "builtin.js",
  "length.js",
  "not-a-constructor.js",
  "prop-desc.js",
  "revived-proxy-revoked.js",
  "revived-proxy.js",
  "reviver-array-define-prop-err.js",
  "reviver-array-delete-err.js",
  "reviver-array-get-prop-from-prototype.js",
  "reviver-array-length-coerce-err.js",
  "reviver-array-length-get-err.js",
  "reviver-array-non-configurable-prop-create.js",
  "reviver-array-non-configurable-prop-delete.js",
  "reviver-call-err.js",
  "reviver-call-order.js",
  "reviver-get-name-err.js",
  "reviver-object-define-prop-err.js",
  "reviver-object-delete-err.js",
  "reviver-object-get-prop-from-prototype.js",
  "reviver-object-non-configurable-prop-create.js",
  "reviver-object-non-configurable-prop-delete.js",
  "reviver-object-own-keys-err.js",
  "reviver-wrapper.js",
]);

// helper used for testing
const sta = await Deno.readTextFile(new URL("./sta.js", import.meta.url));
const assert = await Deno.readTextFile(new URL("./assert.js", import.meta.url));
const propertyHelper = await Deno.readTextFile(
  new URL("./propertyHelper.js", import.meta.url),
);
const jsoncModule = new URL("../../../jsonc.ts", import.meta.url);
for await (
  const dirEntry of walk(fromFileUrl(new URL("./JSON/", import.meta.url)))
) {
  if (!dirEntry.isFile) {
    continue;
  }
  if (ignoreFile.has(dirEntry.name)) {
    continue;
  }
  // Register a test case for each file.
  Deno.test({
    name: `[jsonc] parse test262:${dirEntry.name}`,
    async fn() {
      // Run the test case to make sure there are no errors.
      // Check if the JSONC module passes the test case for JSON.parse.
      const testcode = `
        import * as JSONC from "${jsoncModule}";
        const JSON = JSONC;
        ${sta}
        ${assert}
        ${propertyHelper}
        ${await Deno.readTextFile(dirEntry.path)}
      `;
      await import(`data:text/javascript,${encodeURIComponent(testcode)}`);
    },
  });
}
