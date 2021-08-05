// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assertThrowsAsync } from "../testing/asserts.ts";
import { lookPath } from "./_lp_unix.ts";

Deno.test({
  name: "[fs/lookPath] unix empty path",
  async fn () {
    const tmp = await Deno.makeTempDir({ prefix: "test-deno-std-lookPath-empty" });
    const cwd = Deno.cwd();
    Deno.chdir(tmp);
    const f = await Deno.open("exec_this", {
      write: true,
      create: true,
      mode: 0o700,
    });
    f.close();
    Deno.env.set("PATH", "");

    assertThrowsAsync(() => lookPath("exec_this"));

    Deno.chdir(cwd);
    await Deno.remove(tmp, { recursive: true });
  },
});