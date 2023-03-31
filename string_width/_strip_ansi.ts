// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Ported from chalk/strip-ansi, Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com). MIT License.

export function stripAnsi(str: string) {
  return str.replaceAll(
    // deno-lint-ignore no-control-regex
    /[\x1B\x9B][[\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*|[a-zA-Z\d]+(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\x07)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g,
    "",
  );
}
