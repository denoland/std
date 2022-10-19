// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { isReadableDir, isReadableDirSync } from "./is_readable_dir.ts";

Deno.test("[fs] isReadableNotExist", async function () {
  const tempDirPath: string = await Deno.makeTempDir();
  try {
    assertEquals(
      await isReadableDir(path.join(tempDirPath, "not_exists")),
      false,
    );
  } catch (error) {
    throw error;
  } finally {
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableNotExistSync", function () {
  const tempDirPath: string = Deno.makeTempDirSync();
  try {
    assertEquals(
      isReadableDirSync(path.join(tempDirPath, "not_exists")),
      false,
    );
  } catch (error) {
    throw error;
  } finally {
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableFile", async function () {
  const tempDirPath: string = await Deno.makeTempDir();
  const tempFilePath: string = path.join(tempDirPath, "0.ts");
  const tempFile: Deno.FsFile = await Deno.create(tempFilePath);
  try {
    assertEquals(await isReadableDir(tempFilePath), false);
  } catch (error) {
    throw error;
  } finally {
    tempFile.close();
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableFileSync", function () {
  const tempDirPath: string = Deno.makeTempDirSync();
  const tempFilePath: string = path.join(tempDirPath, "0.ts");
  const tempFile: Deno.FsFile = Deno.createSync(tempFilePath);
  try {
    assertEquals(isReadableDirSync(tempFilePath), false);
  } catch (error) {
    throw error;
  } finally {
    tempFile.close();
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableDir", async function () {
  const tempDirPath: string = await Deno.makeTempDir();
  try {
    assertEquals(isReadableDirSync(tempDirPath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      await Deno.chmod(tempDirPath, 0o000);
      assertEquals(await isReadableDir(tempDirPath), false);
    }
  } catch (error) {
    throw error;
  } finally {
    await Deno.chmod(tempDirPath, 0o755);
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableDirSync", function () {
  const tempDirPath: string = Deno.makeTempDirSync();
  try {
    assertEquals(isReadableDirSync(tempDirPath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempDirPath, 0o000);
      assertEquals(isReadableDirSync(tempDirPath), false);
    }
  } catch (error) {
    throw error;
  } finally {
    Deno.chmodSync(tempDirPath, 0o755);
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableFileLink", async function () {
  const tempDirPath: string = await Deno.makeTempDir();
  const tempFilePath: string = path.join(tempDirPath, "0.ts");
  const tempLinkFilePath: string = path.join(tempDirPath, "0-link.ts");
  const tempFile: Deno.FsFile = await Deno.create(tempFilePath);
  try {
    await Deno.symlink(tempFilePath, tempLinkFilePath);
    assertEquals(await isReadableDir(tempLinkFilePath), false);
  } catch (error) {
    throw error;
  } finally {
    tempFile.close();
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableFileLinkSync", function () {
  const tempDirPath: string = Deno.makeTempDirSync();
  const tempFilePath: string = path.join(tempDirPath, "0.ts");
  const tempLinkFilePath: string = path.join(tempDirPath, "0-link.ts");
  const tempFile: Deno.FsFile = Deno.createSync(tempFilePath);
  try {
    Deno.symlinkSync(tempFilePath, tempLinkFilePath);
    assertEquals(isReadableDirSync(tempLinkFilePath), false);
  } catch (error) {
    throw error;
  } finally {
    tempFile.close();
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableDirLink", async function () {
  const tempDirPath: string = await Deno.makeTempDir();
  const tempLinkDirPath: string = path.join(tempDirPath, "temp-link");
  try {
    await Deno.symlink(tempDirPath, tempLinkDirPath);
    assertEquals(await isReadableDir(tempLinkDirPath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      await Deno.chmod(tempDirPath, 0o000);
      assertEquals(await isReadableDir(tempLinkDirPath), false);
      // TODO(martin-braun): test with missing read permission on link when Rust/Deno supports it
    }
  } catch (error) {
    throw error;
  } finally {
    await Deno.chmod(tempDirPath, 0o755);
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableDirLinkSync", function () {
  const tempDirPath: string = Deno.makeTempDirSync();
  const tempLinkDirPath: string = path.join(tempDirPath, "temp-link");
  try {
    Deno.symlinkSync(tempDirPath, tempLinkDirPath);
    assertEquals(isReadableDirSync(tempLinkDirPath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempDirPath, 0o000);
      assertEquals(isReadableDirSync(tempLinkDirPath), false);
      // TODO(martin-braun): test with missing read permission on link when Rust/Deno supports it
    }
  } catch (error) {
    throw error;
  } finally {
    Deno.chmodSync(tempDirPath, 0o755);
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});
