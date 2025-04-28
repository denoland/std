// Copyright 2018-2025 the Deno authors. MIT license.
import { stripAnsiCode } from "@std/fmt/colors";
import { dirname, fromFileUrl, join, toFileUrl } from "@std/path";
import { assertEquals } from "@std/assert";
import {
  assertInlineSnapshot,
  createAssertInlineSnapshot,
} from "./inline_snapshot.ts";

const SNAPSHOT_MODULE_URL = toFileUrl(join(
  dirname(fromFileUrl(import.meta.url)),
  "snapshot.ts",
));

class TestClass {
  a = 1;
  b = 2;
  init() {
    this.b = 3;
  }
  get getA() {
    return this.a;
  }
  func() {}
}

const map = new Map();
map.set("Hello", "World!");
map.set(() => "Hello", "World!");
map.set(1, 2);

Deno.test("assertInlineSnapshot()", async (t) => {
  await assertInlineSnapshot(
    t,
    { a: 1, b: 2 },
    `{
  a: 1,
  b: 2,
}`,
  );
  await assertInlineSnapshot(
    t,
    new TestClass(),
    `TestClass {
  a: 1,
  b: 2,
}`,
  );
  await assertInlineSnapshot(
    t,
    map,
    `Map(3) {
  "Hello" => "World!",
  1 => 2,
  [Function (anonymous)] => "World!",
}`,
  );
  await assertInlineSnapshot(
    t,
    new Set([1, 2, 3]),
    `Set(3) {
  1,
  2,
  3,
}`,
  );
  await assertInlineSnapshot(
    t,
    { fn() {} },
    `{
  fn: [Function: fn],
}`,
  );
  await assertInlineSnapshot(t, function fn() {}, `[Function: fn]`);
  await assertInlineSnapshot(
    t,
    [1, 2, 3],
    `[
  1,
  2,
  3,
]`,
  );
  await assertInlineSnapshot(t, "hello world", `"hello world"`);
});

Deno.test("assertInlineSnapshot() formats", async () => {
  const tempDir = await Deno.makeTempDir();
  const formatTestFile = join(tempDir, "format_test.ts");
  const noFormatTestFile = join(tempDir, "no_format_test.ts");
  try {
    await Deno.writeTextFile(
      formatTestFile,
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("format", async (t) => {
  await assertInlineSnapshot( t, "hello world", \`CREATE\` );
});`,
    );
    await Deno.writeTextFile(
      noFormatTestFile,
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("no format", async (t) => {
  await assertInlineSnapshot( t, "hello world", \`CREATE\`, { format: false } );
});`,
    );

    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "--no-lock",
        "--allow-read",
        "--allow-write",
        "--allow-run",
        tempDir,
      ],
    });
    await command.output();

    assertEquals(
      await Deno.readTextFile(formatTestFile),
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("format", async (t) => {
  await assertInlineSnapshot(t, "hello world", \`"hello world"\`);
});\n`,
    );
    assertEquals(
      await Deno.readTextFile(noFormatTestFile),
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("no format", async (t) => {
  await assertInlineSnapshot( t, "hello world", \`"hello world"\`, { format: false } );
});`,
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("createAssertInlineSnapshot()", async (t) => {
  const assertMonochromeInlineSnapshot = createAssertInlineSnapshot<string>({
    serializer: stripAnsiCode,
  });
  await assertMonochromeInlineSnapshot(
    t,
    "\x1b[32mThis green text has had its colors stripped\x1b[39m",
    `This green text has had its colors stripped`,
  );
});
