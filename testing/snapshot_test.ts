// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { stripColor } from "../fmt/colors.ts";
import { ensureDir } from "../fs/mod.ts";
import { dirname, fromFileUrl, join } from "../path/mod.ts";
import { assert, assertInstanceOf, AssertionError, fail } from "./asserts.ts";
import { assertSnapshot } from "./snapshot.ts";

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

Deno.test("Snapshot Test", async (t) => {
  await assertSnapshot(t, { a: 1, b: 2 });
  await assertSnapshot(t, new TestClass());
  await assertSnapshot(t, map);
  await assertSnapshot(t, new Set([1, 2, 3]));
  await assertSnapshot(t, { fn() {} });
  await assertSnapshot(t, function fn() {});
  await assertSnapshot(t, [1, 2, 3]);
  await assertSnapshot(t, "hello world");
});

Deno.test("Snapshot Test - step", async (t) => {
  await assertSnapshot(t, { a: 1, b: 2 });
  await t.step("Nested", async (t) => {
    await assertSnapshot(t, new TestClass());
    await assertSnapshot(t, map);
    await t.step("Nested Nested", async (t) => {
      await assertSnapshot(t, new Set([1, 2, 3]));
      await assertSnapshot(t, { fn() {} });
      await assertSnapshot(t, function fn() {});
    });
    await assertSnapshot(t, [1, 2, 3]);
  });
  await assertSnapshot(t, "hello world");
});

Deno.test("Snapshot Test - Adverse String \\ ` ${}", async (t) => {
  await assertSnapshot(t, "\\ ` ${}");
});

Deno.test("Snapshot Test - Multi-Line Strings", async (t) => {
  await t.step("string", async (t) => {
    await assertSnapshot(
      t,
      `
<html>
  <head>
    <title>Snapshot Test - Multi-Line Strings</title>
  </head>
  <body>
    <h1>
      Snapshot Test - Multi-Line Strings
    </h2>
    <p>
      This is a snapshot of a multi-line string.
    </p>
  </body>
</html>`,
    );
  });

  await t.step("string in array", async (t) => {
    await assertSnapshot(t, [
      `
<h1>
  Header
</h1>`,
      `
<p>
  Content
</p>`,
    ]);
  });

  await t.step("string in object", async (t) => {
    await assertSnapshot(t, {
      str: `
        Line #1
        Line #2
        Line #3`,
    });
  });
});

Deno.test("Snapshot Test - Failed Assertion", async (t) => {
  await t.step("Object", async (t) => {
    try {
      await assertSnapshot(t, [1, 2]);
      fail("Expected snapshot not to match");
    } catch (error) {
      assertInstanceOf(error, AssertionError);
      await assertSnapshot(t, stripColor(error.message));
    }
  });
  await t.step("String", async (t) => {
    try {
      await assertSnapshot(t, "Hello!");
      fail("Expected snapshot not to match");
    } catch (error) {
      assertInstanceOf(error, AssertionError);
      await assertSnapshot(t, stripColor(error.message));
    }
  });
});

Deno.test("Snapshot Test - Update", async (t) => {
  const TEMP_DIR = ".tmp";

  async function runTestWithUpdateFlag(test: string, deleteTempDir = true) {
    const testDir = dirname(fromFileUrl(import.meta.url));
    const tempDir = join(testDir, TEMP_DIR);
    const tempTestFileName = "test.ts";
    const tempTestFilePath = join(tempDir, tempTestFileName);
    await ensureDir(tempDir);
    await Deno.writeTextFile(tempTestFilePath, test);

    const process = await Deno.run({
      cmd: ["deno", "test", "--allow-all", tempTestFilePath, "--", "-u"],
      stdout: "piped",
      stderr: "piped",
    });
    const output = await process.output();
    const error = await process.stderrOutput();
    process.close();

    if (deleteTempDir) {
      await Deno.remove(tempDir, { recursive: true });
    }

    return {
      output: new TextDecoder().decode(output),
      error: new TextDecoder().decode(error),
    };
  }

  function formatOutput(string: string) {
    // Strip colors and obfuscate any timings
    return stripColor(string).replace(/([0-9])+m?s/g, "--ms");
  }

  function formatError(string: string) {
    // Strip colors and remove "Check file:///workspaces/deno_std/testing/.tmp/test.ts"
    // as this is always output to stderr
    return stripColor(string).replace(/^Check file:\/\/(.+)\n/g, "");
  }

  /**
   * New snapshot
   */
  const result1 = await runTestWithUpdateFlag(
    `
    import { assertSnapshot } from "../snapshot.ts";

    Deno.test("Snapshot Test - Update", async (t) => {
      await assertSnapshot(t, [
        1,
        2,
      ]);
    });
    `,
    false,
  );

  await assertSnapshot(t, formatOutput(result1.output));
  assert(!formatError(result1.error), "unexpected output to stderr");

  /**
   * Existing snapshot - no changes
   */
  const result2 = await runTestWithUpdateFlag(
    `
    import { assertSnapshot } from "../snapshot.ts";

    Deno.test("Snapshot Test - Update", async (t) => {
      await assertSnapshot(t, [
        1,
        2,
      ]);
    });
    `,
    false,
  );

  await assertSnapshot(t, formatOutput(result2.output));
  assert(!formatError(result2.error), "unexpected output to stderr");

  /**
   * Existing snapshot - updates
   */
  const result3 = await runTestWithUpdateFlag(`
    import { assertSnapshot } from "../snapshot.ts";

    Deno.test("Snapshot Test - Update", async (t) => {
      await assertSnapshot(t, [
        1,
        2,
        3,
        5,
      ]);
    });
  `);

  await assertSnapshot(t, formatOutput(result3.output));
  assert(!formatError(result3.error), "unexpected output to stderr");
});

// Regression test for https://github.com/denoland/deno_std/issues/2140
// Long strings should not be truncated with ellipsis
Deno.test("Snapshot Test - Regression #2140", async (t) => {
  await assertSnapshot(t, {
    title: "Testing a page",
    content: `
      <h1>Testing a page</h1>
      <p>This is a test</p>
      <ul>
        <li>1</li>
        <li>2</li>
        <li>3</li>
        <li>4</li>
      </ul>
      `,
  });
});

// Regression test for https://github.com/denoland/deno_std/issues/2144
// Empty arrays should be compacted
Deno.test("Snapshot Test - Regression #2144", async (t) => {
  const config = {
    fmt: {
      files: {
        exclude: [],
        include: [],
      },
      options: {},
    },
  };
  await assertSnapshot(t, config);
});
