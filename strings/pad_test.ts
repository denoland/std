import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { Side, pad } from "./pad.ts";

test(function padTest() {
  const expected1 = "**deno";
  const expected2 = "deno";
  const expected3 = "deno**";
  const expected4 = "denosorusrex";
  const expected5 = "denosorus";
  const expected6 = "sorusrex";
  const expected7 = "den...";
  const expected8 = "...rex";
  assertEquals(pad("deno", 6, { char: "*", side: Side.Left }), expected1);
  assertEquals(pad("deno", 4, { char: "*", side: Side.Left }), expected2);
  assertEquals(pad("deno", 6, { char: "*", side: Side.Right }), expected3);
  assertEquals(
    pad("denosorusrex", 4, {
      char: "*",
      side: Side.Right,
      strict: false
    }),
    expected4
  );
  assertEquals(
    pad("denosorusrex", 9, {
      char: "*",
      side: Side.Left,
      strict: true,
      strictSide: Side.Right
    }),
    expected5
  );
  assertEquals(
    pad("denosorusrex", 8, {
      char: "*",
      side: Side.Left,
      strict: true,
      strictSide: Side.Left
    }),
    expected6
  );
  assertEquals(
    pad("denosorusrex", 6, {
      char: "*",
      side: Side.Left,
      strict: true,
      strictSide: Side.Right,
      strictChar: "..."
    }),
    expected7
  );
  assertEquals(
    pad("denosorusrex", 6, {
      char: "*",
      side: Side.Left,
      strict: true,
      strictSide: Side.Left,
      strictChar: "..."
    }),
    expected8
  );
  assertEquals(
    pad("deno", 4, {
      char: "*",
      side: Side.Left,
      strict: true,
      strictSide: Side.Right,
      strictChar: "..."
    }),
    expected2
  );
});
