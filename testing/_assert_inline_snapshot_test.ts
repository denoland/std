// Copyright 2018-2025 the Deno authors. MIT license.
import { stripAnsiCode } from "@std/fmt/colors";
import { dirname, fromFileUrl, join, toFileUrl } from "@std/path";
import { assertEquals } from "@std/assert";
import {
  assertInlineSnapshot,
  createAssertInlineSnapshot,
} from "./_assert_inline_snapshot.ts";

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

Deno.test("assertInlineSnapshot()", (t) => {
  assertInlineSnapshot(
    t,
    { a: 1, b: 2 },
    `{
  a: 1,
  b: 2,
}`,
  );
  assertInlineSnapshot(
    t,
    new TestClass(),
    `TestClass {
  a: 1,
  b: 2,
}`,
  );
  assertInlineSnapshot(
    t,
    map,
    `Map(3) {
  "Hello" => "World!",
  1 => 2,
  [Function (anonymous)] => "World!",
}`,
  );
  assertInlineSnapshot(
    t,
    new Set([1, 2, 3]),
    `Set(3) {
  1,
  2,
  3,
}`,
  );
  assertInlineSnapshot(
    t,
    { fn() {} },
    `{
  fn: [Function: fn],
}`,
  );
  assertInlineSnapshot(t, function fn() {}, `[Function: fn]`);
  assertInlineSnapshot(
    t,
    [1, 2, 3],
    `[
  1,
  2,
  3,
]`,
  );
  assertInlineSnapshot(t, "hello world", `"hello world"`);
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
  assertInlineSnapshot( t, "hello world", "" );
});`,
    );
    await Deno.writeTextFile(
      noFormatTestFile,
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("no format", async (t) => {
  assertInlineSnapshot( t, "hello world", "", { format: false } );
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
        "--",
        "--update",
      ],
    });
    await command.output();

    assertEquals(
      await Deno.readTextFile(formatTestFile),
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("format", async (t) => {
  assertInlineSnapshot(t, "hello world", \`"hello world"\`);
});\n`,
    );
    assertEquals(
      await Deno.readTextFile(noFormatTestFile),
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("no format", async (t) => {
  assertInlineSnapshot( t, "hello world", \`"hello world"\`, { format: false } );
});`,
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("assertInlineSnapshot() counts lines and columns like V8", async () => {
  const tempDir = await Deno.makeTempDir();
  const countTestFile = join(tempDir, "count_test.ts");
  try {
    await Deno.writeTextFile(
      countTestFile,
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
 \n \r \n\r \r\n 
Deno.test("format", async (t) => {
  /* 🐈‍⬛🇦🇶 */ assertInlineSnapshot(t, "hello world", "", { format: false });
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
        "--",
        "--update",
      ],
    });
    await command.output();

    assertEquals(
      await Deno.readTextFile(countTestFile),
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
 \n \r \n\r \r\n 
Deno.test("format", async (t) => {
  /* 🐈‍⬛🇦🇶 */ assertInlineSnapshot(t, "hello world", \`"hello world"\`, { format: false });
});`,
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("createAssertInlineSnapshot()", (t) => {
  const assertMonochromeInlineSnapshot = createAssertInlineSnapshot<string>({
    serializer: stripAnsiCode,
  });
  assertMonochromeInlineSnapshot(
    t,
    "\x1b[32mThis green text has had its colors stripped\x1b[39m",
    `This green text has had its colors stripped`,
  );
});
