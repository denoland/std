import { warnDeprecatedApi } from "../warn_deprecated_api.ts";

function fn() {
  warnDeprecatedApi("fn()", "1.0.0", "Use `y` instead.");
  console.log("Hello, world!");
}

fn();
fn();
