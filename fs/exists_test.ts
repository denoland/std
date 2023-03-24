// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertStringIncludes } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { exists, existsSync } from "./exists.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("[fs] existsNotExist", async function () {
  const tempDirPath = await Deno.makeTempDir();
  try {
    assertEquals(await exists(path.join(tempDirPath, "not_exists")), false);
  } catch (error) {
    throw error;
  } finally {
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] existsNotExistSync", function () {
  const tempDirPath = Deno.makeTempDirSync();
  try {
    assertEquals(existsSync(path.join(tempDirPath, "not_exists")), false);
  } catch (error) {
    throw error;
  } finally {
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] existsFile", async function () {
  const tempDirPath = await Deno.makeTempDir();
  const tempFilePath = path.join(tempDirPath, "0.ts");
  const tempFile = await Deno.create(tempFilePath);
  try {
    assertEquals(await exists(tempFilePath), true);
    assertEquals(await exists(tempFilePath, {}), true);
    assertEquals(
      await exists(tempFilePath, {
        isDirectory: true,
      }),
      false,
    );
    assertEquals(
      await exists(tempFilePath, {
        isFile: true,
      }),
      true,
    );
    if (Deno.build.os !== "windows") {
      // TODO(martin-braun): include mode check for Windows tests when chmod is ported to NT
      await Deno.chmod(tempFilePath, 0o000);
      assertEquals(
        await exists(tempFilePath, {
          isReadable: true,
        }),
        false,
      );
    }
  } catch (error) {
    throw error;
  } finally {
    if (Deno.build.os !== "windows") {
      await Deno.chmod(tempFilePath, 0o644);
    }
    tempFile.close();
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] existsFileLink", async function () {
  const tempDirPath = await Deno.makeTempDir();
  const tempFilePath = path.join(tempDirPath, "0.ts");
  const tempLinkFilePath = path.join(tempDirPath, "0-link.ts");
  const tempFile = await Deno.create(tempFilePath);
  try {
    await Deno.symlink(tempFilePath, tempLinkFilePath);
    assertEquals(await exists(tempLinkFilePath), true);
    assertEquals(await exists(tempLinkFilePath, {}), true);
    assertEquals(
      await exists(tempLinkFilePath, {
        isDirectory: true,
      }),
      false,
    );
    assertEquals(
      await exists(tempLinkFilePath, {
        isFile: true,
      }),
      true,
    );
    if (Deno.build.os !== "windows") {
      // TODO(martin-braun): include mode check for Windows tests when chmod is ported to NT
      await Deno.chmod(tempFilePath, 0o000);
      assertEquals(
        await exists(tempLinkFilePath, {
          isReadable: true,
        }),
        false,
      );
      // TODO(martin-braun): test unreadable link when Rust's nix::sys::stat::fchmodat has been implemented
    }
  } catch (error) {
    throw error;
  } finally {
    if (Deno.build.os !== "windows") {
      await Deno.chmod(tempFilePath, 0o644);
    }
    tempFile.close();
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] existsFileSync", function () {
  const tempDirPath = Deno.makeTempDirSync();
  const tempFilePath = path.join(tempDirPath, "0.ts");
  const tempFile = Deno.createSync(tempFilePath);
  try {
    assertEquals(existsSync(tempFilePath), true);
    assertEquals(existsSync(tempFilePath, {}), true);
    assertEquals(
      existsSync(tempFilePath, {
        isDirectory: true,
      }),
      false,
    );
    assertEquals(
      existsSync(tempFilePath, {
        isFile: true,
      }),
      true,
    );
    if (Deno.build.os !== "windows") {
      // TODO(martin-braun): include mode check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempFilePath, 0o000);
      assertEquals(
        existsSync(tempFilePath, {
          isReadable: true,
        }),
        false,
      );
    }
  } catch (error) {
    throw error;
  } finally {
    if (Deno.build.os !== "windows") {
      Deno.chmodSync(tempFilePath, 0o644);
    }
    tempFile.close();
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] existsFileLinkSync", function () {
  const tempDirPath = Deno.makeTempDirSync();
  const tempFilePath = path.join(tempDirPath, "0.ts");
  const tempLinkFilePath = path.join(tempDirPath, "0-link.ts");
  const tempFile = Deno.createSync(tempFilePath);
  try {
    Deno.symlinkSync(tempFilePath, tempLinkFilePath);
    assertEquals(existsSync(tempLinkFilePath), true);
    assertEquals(existsSync(tempLinkFilePath, {}), true);
    assertEquals(
      existsSync(tempLinkFilePath, {
        isDirectory: true,
      }),
      false,
    );
    assertEquals(
      existsSync(tempLinkFilePath, {
        isFile: true,
      }),
      true,
    );
    if (Deno.build.os !== "windows") {
      // TODO(martin-braun): include mode check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempFilePath, 0o000);
      assertEquals(
        existsSync(tempLinkFilePath, {
          isReadable: true,
        }),
        false,
      );
      // TODO(martin-braun): test unreadable link when Rust's nix::sys::stat::fchmodat has been implemented
    }
  } catch (error) {
    throw error;
  } finally {
    if (Deno.build.os !== "windows") {
      Deno.chmodSync(tempFilePath, 0o644);
    }
    tempFile.close();
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] existsDir", async function () {
  const tempDirPath = await Deno.makeTempDir();
  try {
    assertEquals(await exists(tempDirPath), true);
    assertEquals(await exists(tempDirPath, {}), true);
    assertEquals(
      await exists(tempDirPath, {
        isDirectory: true,
      }),
      true,
    );
    assertEquals(
      await exists(tempDirPath, {
        isFile: true,
      }),
      false,
    );
    if (Deno.build.os !== "windows") {
      // TODO(martin-braun): include mode check for Windows tests when chmod is ported to NT
      await Deno.chmod(tempDirPath, 0o000);
      assertEquals(
        await exists(tempDirPath, {
          isReadable: true,
        }),
        false,
      );
    }
  } catch (error) {
    throw error;
  } finally {
    if (Deno.build.os !== "windows") {
      await Deno.chmod(tempDirPath, 0o755);
    }
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] existsDirLink", async function () {
  const tempDirPath = await Deno.makeTempDir();
  const tempLinkDirPath = path.join(tempDirPath, "temp-link");
  try {
    await Deno.symlink(tempDirPath, tempLinkDirPath);
    assertEquals(await exists(tempLinkDirPath), true);
    assertEquals(await exists(tempLinkDirPath, {}), true);
    assertEquals(
      await exists(tempLinkDirPath, {
        isDirectory: true,
      }),
      true,
    );
    assertEquals(
      await exists(tempLinkDirPath, {
        isFile: true,
      }),
      false,
    );
    if (Deno.build.os !== "windows") {
      // TODO(martin-braun): include mode check for Windows tests when chmod is ported to NT
      await Deno.chmod(tempDirPath, 0o000);
      assertEquals(
        await exists(tempLinkDirPath, {
          isReadable: true,
        }),
        false,
      );
      // TODO(martin-braun): test unreadable link when Rust's nix::sys::stat::fchmodat has been implemented
    }
  } catch (error) {
    throw error;
  } finally {
    if (Deno.build.os !== "windows") {
      await Deno.chmod(tempDirPath, 0o755);
    }
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] existsDirSync", function () {
  const tempDirPath = Deno.makeTempDirSync();
  try {
    assertEquals(existsSync(tempDirPath), true);
    assertEquals(existsSync(tempDirPath, {}), true);
    assertEquals(
      existsSync(tempDirPath, {
        isDirectory: true,
      }),
      true,
    );
    assertEquals(
      existsSync(tempDirPath, {
        isFile: true,
      }),
      false,
    );
    if (Deno.build.os !== "windows") {
      // TODO(martin-braun): include mode check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempDirPath, 0o000);
      assertEquals(
        existsSync(tempDirPath, {
          isReadable: true,
        }),
        false,
      );
    }
  } catch (error) {
    throw error;
  } finally {
    if (Deno.build.os !== "windows") {
      Deno.chmodSync(tempDirPath, 0o755);
    }
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] existsDirLinkSync", function () {
  const tempDirPath = Deno.makeTempDirSync();
  const tempLinkDirPath = path.join(tempDirPath, "temp-link");
  try {
    Deno.symlinkSync(tempDirPath, tempLinkDirPath);
    assertEquals(existsSync(tempLinkDirPath), true);
    assertEquals(existsSync(tempLinkDirPath, {}), true);
    assertEquals(
      existsSync(tempLinkDirPath, {
        isDirectory: true,
      }),
      true,
    );
    assertEquals(
      existsSync(tempLinkDirPath, {
        isFile: true,
      }),
      false,
    );
    if (Deno.build.os !== "windows") {
      // TODO(martin-braun): include mode check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempDirPath, 0o000);
      assertEquals(
        existsSync(tempLinkDirPath, {
          isReadable: true,
        }),
        false,
      );
      // TODO(martin-braun): test unreadable link when Rust's nix::sys::stat::fchmodat has been implemented
    }
  } catch (error) {
    throw error;
  } finally {
    if (Deno.build.os !== "windows") {
      Deno.chmodSync(tempDirPath, 0o755);
    }
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

/**
 * Scenes control additional permission tests by spawning new Deno processes with and without --allow-read flag.
 */
interface Scene {
  read: boolean; // true to test with --allow-read
  sync: boolean; // true to test sync
  fictional: boolean; // true to test on non existing file
  output: string; // required string include of stdout to succeed
}

const scenes: Scene[] = [
  // 1
  {
    read: false,
    sync: false,
    fictional: false,
    output: "run again with the --allow-read flag",
  },
  {
    read: false,
    sync: true,
    fictional: false,
    output: "run again with the --allow-read flag",
  },
  // 2
  {
    read: true,
    sync: false,
    fictional: false,
    output: "exist",
  },
  {
    read: true,
    sync: true,
    fictional: false,
    output: "exist",
  },
  // 3
  {
    read: false,
    sync: false,
    fictional: true,
    output: "run again with the --allow-read flag",
  },
  {
    read: false,
    sync: true,
    fictional: true,
    output: "run again with the --allow-read flag",
  },
  // 4
  {
    read: true,
    sync: false,
    fictional: true,
    output: "not exist",
  },
  {
    read: true,
    sync: true,
    fictional: true,
    output: "not exist",
  },
];

for (const s of scenes) {
  let title = `test ${!s.sync ? "exists" : "existsSync"} on`;
  title += ` ${s.fictional ? "fictional" : "real"} file`;
  title += ` ${s.read ? "with" : "without"} --allow-read`;
  Deno.test(`[fs] existsPermission ${title}`, async function () {
    const args = ["run", "--quiet", "--no-prompt"];

    if (s.read) {
      args.push("--allow-read");
    }
    args.push(path.join(testdataDir, !s.sync ? "exists.ts" : "exists_sync.ts"));

    let tempFilePath = "does_not_exist.ts";
    let tempDirPath: string | null = null;
    let tempFile: Deno.FsFile | null = null;
    if (!s.fictional) {
      tempDirPath = await Deno.makeTempDir();
      tempFilePath = path.join(tempDirPath, "0.ts");
      tempFile = await Deno.create(tempFilePath);
    }
    args.push(tempFilePath);

    const command = new Deno.Command(Deno.execPath(), {
      args,
    });
    const { stdout } = await command.output();

    if (tempFile != null) {
      tempFile.close();
      await Deno.remove(tempDirPath!, { recursive: true });
    }

    assertStringIncludes(new TextDecoder().decode(stdout), s.output);
  });
  // done
}
