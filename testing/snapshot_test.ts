// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { stripColor } from "../fmt/colors.ts";
import { dirname, fromFileUrl, join, toFileUrl } from "../path/mod.ts";
import { assert, assertInstanceOf, AssertionError, fail } from "./asserts.ts";
import { assertSnapshot, serialize } from "./snapshot.ts";

const SNAPSHOT_MODULE_URL = toFileUrl(join(
  dirname(fromFileUrl(import.meta.url)),
  "snapshot.ts",
));

function formatTestOutput(string: string) {
  // Strip colors and obfuscate any timings
  return stripColor(string).replace(/([0-9])+m?s/g, "--ms").replace(
    /(?<=running 1 test from )(.*)(?=test.ts)/g,
    "<tempDir>/",
  );
}

function formatTestError(string: string) {
  // Strip colors and remove "Check file:///workspaces/deno_std/testing/.tmp/test.ts"
  // as this is always output to stderr
  return stripColor(string).replace(/^Check file:\/\/(.+)\n/g, "");
}

function testFnWithTempDir(
  fn: (t: Deno.TestContext, tempDir: string) => Promise<void>,
) {
  return async (t: Deno.TestContext) => {
    const tempDir = await Deno.makeTempDir();
    try {
      await fn(t, tempDir);
      await Deno.remove(tempDir, { recursive: true });
    } catch (err) {
      await Deno.remove(tempDir, { recursive: true });
      throw err;
    }
  };
}

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

Deno.test(
  "Snapshot Test - Failed Assertion",
  testFnWithTempDir(async (t, tempDir) => {
    let count = 0;
    async function testFailedAssertion<T>(
      snapshot: T,
      actual: T,
    ): Promise<AssertionError> {
      const snapshotFilePath = join(tempDir, `snapshot_file_${++count}.snap`);
      await Deno.writeTextFile(
        snapshotFilePath,
        `export const snapshot = {};

snapshot[\`name 1\`] = \`
${serialize(snapshot)}
\`;
`,
      );

      try {
        await assertSnapshot(t, actual, {
          path: snapshotFilePath,
          mode: "assert",
          name: "name",
        });
        fail("Snapshot assertion passed when it was expected to fail");
      } catch (error) {
        assertInstanceOf(error, AssertionError);
        return error as AssertionError;
      }
    }

    await t.step("Object", async (t) => {
      const error = await testFailedAssertion([1, 2, 3], [1, 2]);
      await assertSnapshot(t, stripColor(error.message));
    });

    await t.step("String", async (t) => {
      const error = await testFailedAssertion("Hello World!", "Hello!");
      await assertSnapshot(t, stripColor(error.message));
    });
  }),
);

Deno.test("Snapshot Test - Options", async (t) => {
  const VALUE = [1, 2, 3];

  await t.step("dir", async (t) => {
    await t.step("relative", async (t) => {
      await assertSnapshot(t, VALUE, {
        dir: "__snapshots__/options_tests/",
      });
    });

    await t.step("absolute", async (t) => {
      await assertSnapshot(t, VALUE, {
        dir: join(Deno.cwd(), "testing/__snapshots__/options_tests/"),
      });
    });
  });

  await t.step("path", async (t) => {
    await t.step("relative", async (t) => {
      await assertSnapshot(t, VALUE, {
        path: "__snapshots__/options_tests/custom_path.snap",
      });
    });

    await t.step("absolute", async (t) => {
      await assertSnapshot(t, VALUE, {
        path: join(
          Deno.cwd(),
          "testing/__snapshots__/options_tests/custom_path.snap",
        ),
      });
    });
  });

  await t.step("name", async (t) => {
    await assertSnapshot(t, VALUE, {
      name: "custom name",
    });

    await assertSnapshot(t, VALUE, {
      name: "custom name",
    });
  });

  await t.step("serializer", async (t) => {
    await assertSnapshot<Array<number>>(t, VALUE, {
      serializer: (actual) => {
        return `Array Length: ${actual.length}\n\n${serialize(actual)}`;
      },
    });
  });

  await t.step("msg", async (t) => {
    await t.step("missing snapshot", async (t) => {
      try {
        await assertSnapshot<Array<number>>(t, VALUE, {
          msg: "[CUSTOM ERROR MESSAGE - MISSING SNAPSHOT]",
          mode: "assert",
          name: "MISSING SNAPSHOT",
        });
        fail("Snapshot should not exist");
      } catch (error) {
        assertInstanceOf(error, AssertionError);
        await assertSnapshot(t, error.message);
      }
    });

    await t.step("missing snapshot file", async (t) => {
      try {
        await assertSnapshot<Array<number>>(t, VALUE, {
          msg: "[CUSTOM ERROR MESSAGE - MISSING SNAPSHOT]",
          mode: "assert",
          path: "MISSING_SNAPSHOT_FILE.snap",
        });
        fail("Snapshot file should not exist");
      } catch (error) {
        assertInstanceOf(error, AssertionError);
        await assertSnapshot(t, error.message);
      }
    });
  });

  await t.step(
    "mode",
    testFnWithTempDir(async (t, tempDir) => {
      const snapshotFilePath = join(tempDir, "snapshot.snap");
      const snapshotName = "snapshot";

      async function runTest(test: string) {
        const tempTestFileName = "test.ts";
        const tempTestFilePath = join(tempDir, tempTestFileName);
        await Deno.writeTextFile(tempTestFilePath, test);

        const process = await Deno.run({
          cmd: ["deno", "test", "--allow-all", tempTestFilePath, "--", "-u"],
          stdout: "piped",
          stderr: "piped",
        });
        const output = await process.output();
        const error = await process.stderrOutput();
        process.close();

        return {
          output: new TextDecoder().decode(output),
          error: new TextDecoder().decode(error),
        };
      }

      const result = await runTest(`
        import { assertSnapshot } from "${SNAPSHOT_MODULE_URL}";

        Deno.test("${snapshotName}", async (t) => {
          await assertSnapshot(t, [1, 2, 3], {
            path: "${snapshotFilePath.replace(/\\/g, "\\\\")}",
            mode: "update",
          });
        });
      `);

      const { snapshot } = await import(toFileUrl(snapshotFilePath).toString());

      await assertSnapshot(t, snapshot[`${snapshotName} 1`]);
      await assertSnapshot(t, formatTestOutput(result.output));
      assert(!formatTestError(result.error), "unexpected output to stderr");
    }),
  );
});

Deno.test(
  "Snapshot Test - Update",
  testFnWithTempDir(async (t, tempDir) => {
    async function runTestWithUpdateFlag(test: string) {
      const tempTestFileName = "test.ts";
      const tempTestFilePath = join(tempDir, tempTestFileName);
      await Deno.writeTextFile(tempTestFilePath, test);

      const process = await Deno.run({
        cmd: ["deno", "test", "--allow-all", tempTestFilePath, "--", "-u"],
        stdout: "piped",
        stderr: "piped",
      });
      const output = await process.output();
      const error = await process.stderrOutput();
      process.close();

      return {
        output: new TextDecoder().decode(output),
        error: new TextDecoder().decode(error),
      };
    }

    function assertNoError(error: string) {
      if (formatTestError(error)) {
        throw new AssertionError(`Unexpected Error:\n\n${error}\n`);
      }
    }

    /**
     * New snapshot
     */
    const result1 = await runTestWithUpdateFlag(
      `
      import { assertSnapshot } from "${SNAPSHOT_MODULE_URL}";

      Deno.test("Snapshot Test - Update", async (t) => {
        await assertSnapshot(t, [
          1,
          2,
        ]);
      });`,
    );

    assertNoError(result1.error);
    await assertSnapshot(t, formatTestOutput(result1.output));

    /**
     * Existing snapshot - no changes
     */
    const result2 = await runTestWithUpdateFlag(
      `
      import { assertSnapshot } from "${SNAPSHOT_MODULE_URL}";

      Deno.test("Snapshot Test - Update", async (t) => {
        await assertSnapshot(t, [
          1,
          2,
        ]);
      });`,
    );

    assertNoError(result2.error);
    await assertSnapshot(t, formatTestOutput(result2.output));

    /**
     * Existing snapshot - updates
     */
    const result3 = await runTestWithUpdateFlag(`
      import { assertSnapshot } from "${SNAPSHOT_MODULE_URL}";

      Deno.test("Snapshot Test - Update", async (t) => {
        await assertSnapshot(t, [
          1,
          2,
          3,
          5,
        ]);
      });
    `);

    assertNoError(result3.error);
    await assertSnapshot(t, formatTestOutput(result3.output));
  }),
);

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
