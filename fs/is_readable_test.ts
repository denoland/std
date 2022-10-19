// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { isReadable, isReadableSync } from "./is_readable.ts";

Deno.test("[fs] isReadableNotExist", async function () {
  const tempDirPath: string = await Deno.makeTempDir();
  try {
    assertEquals(
      await isReadable(path.join(tempDirPath, "not_exists")),
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
      isReadableSync(path.join(tempDirPath, "not_exists")),
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
    assertEquals(await isReadable(tempFilePath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      await Deno.chmod(tempFilePath, 0o000);
      assertEquals(await isReadable(tempFilePath), false);
    }
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
    assertEquals(isReadableSync(tempFilePath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempFilePath, 0o000);
      assertEquals(isReadableSync(tempFilePath), false);
    }
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
    assertEquals(isReadableSync(tempDirPath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      await Deno.chmod(tempDirPath, 0o000);
      assertEquals(await isReadable(tempDirPath), false);
    }
  } catch (error) {
    throw error;
  } finally {
    await Deno.chmod(tempDirPath, 0o755);
    await Deno.remove(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableDirSync", function () {
  const tempDirPath = Deno.makeTempDirSync();
  try {
    assertEquals(isReadableSync(tempDirPath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempDirPath, 0o000);
      assertEquals(isReadableSync(tempDirPath), false);
    }
  } catch (error) {
    throw error;
  } finally {
    Deno.chmodSync(tempDirPath, 0o755);
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableFileLink", async function () {
  const tempDirPath = await Deno.makeTempDir();
  const tempFilePath = path.join(tempDirPath, "0.ts");
  const tempLinkFilePath = path.join(tempDirPath, "0-link.ts");
  const tempFile: Deno.FsFile = await Deno.create(tempFilePath);
  try {
    await Deno.symlink(tempFilePath, tempLinkFilePath);
    assertEquals(await isReadable(tempLinkFilePath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      await Deno.chmod(tempFilePath, 0o000);
      assertEquals(await isReadable(tempLinkFilePath), false);
    }
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
    assertEquals(isReadableSync(tempLinkFilePath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempFilePath, 0o000);
      assertEquals(isReadableSync(tempLinkFilePath), false);
    }
  } catch (error) {
    throw error;
  } finally {
    tempFile.close();
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});

Deno.test("[fs] isReadableDirLink", async function () {
  const tempDirPath = await Deno.makeTempDir();
  const tempLinkDirPath = path.join(tempDirPath, "temp-link");
  try {
    await Deno.symlink(tempDirPath, tempLinkDirPath);
    assertEquals(await isReadable(tempLinkDirPath), true);
    if (Deno.build.os != "windows") {
      await Deno.chmod(tempDirPath, 0o000);
      assertEquals(await isReadable(tempLinkDirPath), false);
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
    assertEquals(isReadableSync(tempLinkDirPath), true);
    if (Deno.build.os != "windows") {
      // TODO(martin-braun): include permission check for Windows tests when chmod is ported to NT
      Deno.chmodSync(tempDirPath, 0o000);
      assertEquals(isReadableSync(tempLinkDirPath), false);
      // TODO(martin-braun): test with missing read permission on link when Rust/Deno supports it
    }
  } catch (error) {
    throw error;
  } finally {
    Deno.chmodSync(tempDirPath, 0o755);
    Deno.removeSync(tempDirPath, { recursive: true });
  }
});
