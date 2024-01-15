// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { warnDeprecatedApi } from "../warn_deprecated_api.ts";

function fn() {
  warnDeprecatedApi({
    name: "fn()",
    stack: new Error().stack!,
    version: "1.0.0",
    message: "Use `y` instead.",
  });
  console.log("Hello, world!");
}

for (let i = 0; i < 2; i++) {
  fn();
}
