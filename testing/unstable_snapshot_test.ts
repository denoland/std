// Copyright 2018-2026 the Deno authors. MIT license.
import { stripAnsiCode } from "@std/fmt/colors";
import { dirname, fromFileUrl, join, toFileUrl } from "@std/path";
import { assertEquals } from "@std/assert";
import {
  assertInlineSnapshot,
  createAssertInlineSnapshot,
} from "./unstable_snapshot.ts";
import { LINT_SUPPORTED } from "./_snapshot_utils.ts";

const SNAPSHOT_MODULE_URL = toFileUrl(join(
  dirname(fromFileUrl(import.meta.url)),
  "unstable_snapshot.ts",
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

Deno.test("assertInlineSnapshot()", () => {
  assertInlineSnapshot(
    { a: 1, b: 2 },
    `{
  a: 1,
  b: 2,
}`,
  );
  assertInlineSnapshot(
    new TestClass(),
    `TestClass {
  a: 1,
  b: 2,
}`,
  );
  assertInlineSnapshot(
    map,
    `Map(3) {
  "Hello" => "World!",
  1 => 2,
  [Function (anonymous)] => "World!",
}`,
  );
  assertInlineSnapshot(
    new Set([1, 2, 3]),
    `Set(3) {
  1,
  2,
  3,
}`,
  );
  assertInlineSnapshot(
    { fn() {} },
    `{
  fn: [Function: fn],
}`,
  );
  assertInlineSnapshot(function fn() {}, `[Function: fn]`);
  assertInlineSnapshot(
    [1, 2, 3],
    `[
  1,
  2,
  3,
]`,
  );
  assertInlineSnapshot("hello world", `"hello world"`);
});

Deno.test("assertInlineSnapshot() formats", async () => {
  if (!LINT_SUPPORTED) return;

  const fileContents =
    `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("format test", async () => {
  assertInlineSnapshot( "hello world", "" );
});`;

  const tempDir = await Deno.makeTempDir();
  const formatTestFile = join(tempDir, "format_test.ts");
  const noFormatTestFile = join(tempDir, "no_format_test.ts");
  try {
    await Deno.writeTextFile(formatTestFile, fileContents);
    await Deno.writeTextFile(noFormatTestFile, fileContents);

    const formatCommand = new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "--no-lock",
        "--allow-read",
        "--allow-write",
        "--allow-run",
        formatTestFile,
        "--",
        "--update",
      ],
    });
    await formatCommand.output();

    const noFormatCommand = new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "--no-lock",
        "--allow-read",
        "--allow-write",
        noFormatTestFile,
        "--",
        "--update",
        "--no-format",
      ],
    });
    await noFormatCommand.output();

    assertEquals(
      await Deno.readTextFile(formatTestFile),
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("format test", async () => {
  assertInlineSnapshot("hello world", \`"hello world"\`);
});\n`,
    );
    assertEquals(
      await Deno.readTextFile(noFormatTestFile),
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
Deno.test("format test", async () => {
  assertInlineSnapshot( "hello world", \`"hello world"\` );
});`,
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("assertInlineSnapshot() counts lines and columns like V8", async () => {
  if (!LINT_SUPPORTED) return;

  const tempDir = await Deno.makeTempDir();
  const countTestFile = join(tempDir, "count_test.ts");
  try {
    await Deno.writeTextFile(
      countTestFile,
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
 \n \r \n\r \r\n \u2028 \u2029 
Deno.test("format", async () => {
  /* 🐈‍⬛🇦🇶 */ assertInlineSnapshot( "hello world", "" );
});`,
    );

    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "--no-lock",
        "--allow-read",
        "--allow-write",
        tempDir,
        "--",
        "--update",
        "--no-format",
      ],
    });
    await command.output();

    assertEquals(
      await Deno.readTextFile(countTestFile),
      `import { assertInlineSnapshot } from "${SNAPSHOT_MODULE_URL}";
 \n \r \n\r \r\n \u2028 \u2029 
Deno.test("format", async () => {
  /* 🐈‍⬛🇦🇶 */ assertInlineSnapshot( "hello world", \`"hello world"\` );
});`,
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("createAssertInlineSnapshot()", () => {
  const assertMonochromeInlineSnapshot = createAssertInlineSnapshot<string>({
    serializer: stripAnsiCode,
  });
  assertMonochromeInlineSnapshot(
    "\x1b[32mThis green text has had its colors stripped\x1b[39m",
    `This green text has had its colors stripped`,
  );
});
