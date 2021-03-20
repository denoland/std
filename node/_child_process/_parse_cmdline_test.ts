// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../../testing/asserts.ts";
import { parseCmdline } from "./_parse_cmdline.ts";

Deno.test("[node/_child_process] parseCmdline()", () => {
  assertEquals(parseCmdline("echo"), ["echo"]);
  assertEquals(parseCmdline(`"echo"`), ["echo"]);
  assertEquals(parseCmdline("echo ok"), ["echo", "ok"]);
  assertEquals(parseCmdline(" echo  ok "), ["echo", "ok"]);
  assertEquals(parseCmdline(`"echo" ok`), ["echo", "ok"]);
  assertEquals(parseCmdline(`"echo" "ok"`), ["echo", "ok"]);
  assertEquals(
    parseCmdline(`"${Deno.execPath()}" eval -p "Deno.env.toObject().BAZ"`),
    [Deno.execPath(), "eval", "-p", "Deno.env.toObject().BAZ"],
  );
  assertEquals(parseCmdline(" echo  ok "), ["echo", "ok"]);
});
