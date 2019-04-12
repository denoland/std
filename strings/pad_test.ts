import { test } from "../testing/mod.ts";
import { assert, assertEquals } from "../testing/asserts.ts";
import { pad } from "./pad.ts";
import { BufReader } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";
const { run } = Deno;

let fileServer;

async function startFileServer(): Promise<void> {
  fileServer = run({
    args: [
      "deno",
      "--allow-read",
      "--allow-net",
      "http/file_server.ts",
      ".",
      "--cors"
    ],
    stdout: "piped"
  });
  // Once fileServer is ready it will write to its stdout.
  const r = new TextProtoReader(new BufReader(fileServer.stdout));
  const [s, err] = await r.readLine();
  assert(err == null);
  assert(s.includes("server listening"));
}

function killFileServer(): void {
  fileServer.close();
  fileServer.stdout.close();
}

test({
  name: "[PAD] Browser test",
  async fn() {
    await startFileServer();
    try {
      const c = new TextDecoder();
      run({
        args: ["tsc", "-m", "ES6", "strings/pad.ts"],
        stdout: "piped"
      });
      const puppeteer = run({
        args: ["node", "strings/e2e/test.e2e.js"],
        stdout: "piped"
      });
      let out = await puppeteer.output();
      assertEquals(c.decode(out), "OK\n");
    } finally {
      killFileServer();
    }
  }
});

test(function padTest() {
  const expected1 = "**deno";
  const expected2 = "deno";
  const expected3 = "deno**";
  const expected4 = "denosorusrex";
  const expected5 = "denosorus";
  const expected6 = "sorusrex";
  const expected7 = "den...";
  const expected8 = "...rex";
  assertEquals(pad("deno", 6, { char: "*", side: "left" }), expected1);
  assertEquals(pad("deno", 4, { char: "*", side: "left" }), expected2);
  assertEquals(pad("deno", 6, { char: "*", side: "right" }), expected3);
  assertEquals(
    pad("denosorusrex", 4, {
      char: "*",
      side: "right",
      strict: false
    }),
    expected4
  );
  assertEquals(
    pad("denosorusrex", 9, {
      char: "*",
      side: "left",
      strict: true,
      strictSide: "right"
    }),
    expected5
  );
  assertEquals(
    pad("denosorusrex", 8, {
      char: "*",
      side: "left",
      strict: true,
      strictSide: "left"
    }),
    expected6
  );
  assertEquals(
    pad("denosorusrex", 6, {
      char: "*",
      side: "left",
      strict: true,
      strictSide: "right",
      strictChar: "..."
    }),
    expected7
  );
  assertEquals(
    pad("denosorusrex", 6, {
      char: "*",
      side: "left",
      strict: true,
      strictSide: "left",
      strictChar: "..."
    }),
    expected8
  );
  assertEquals(
    pad("deno", 4, {
      char: "*",
      side: "left",
      strict: true,
      strictSide: "right",
      strictChar: "..."
    }),
    expected2
  );
});
