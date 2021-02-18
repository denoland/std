// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assert } from "../testing/asserts.ts";
import { isatty } from "./tty.ts";

Deno.test("[node/tty isatty] returns true when fd is a tty, false otherwise", () => {
  assert(Deno.isatty(Deno.stdin.rid) === isatty(Deno.stdin.rid));
  assert(Deno.isatty(Deno.stdout.rid) === isatty(Deno.stdout.rid));
  assert(Deno.isatty(Deno.stderr.rid) === isatty(Deno.stderr.rid));

  const file = Deno.openSync("README.md");
  assert(!isatty(file.rid));
  Deno.close(file.rid);
});

Deno.test("[node/tty isatty] returns false for irrelevant values", () => {
  // invalid numeric fd
  assert(!isatty(1234567));

  // invalid type fd
  assert(!isatty("abc"));
  assert(!isatty({}));
  assert(!isatty([]));
  assert(!isatty(null));
  assert(!isatty(undefined));
});
