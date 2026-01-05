// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { chown, chownSync } from "./unstable_chown.ts";
import { NotFound } from "./unstable_errors.js";
import { makeTempFile, makeTempFileSync } from "./unstable_make_temp_file.ts";
import { remove, removeSync } from "./unstable_remove.ts";
import { platform } from "node:os";
import { spawn } from "node:child_process";

const isBun = navigator.userAgent.includes("Bun/");

type IdResult = {
  id: string;
  code: number;
};

function runId(
  option?: "group" | "user",
): Promise<IdResult> {
  return new Promise((resolve, reject) => {
    let id;
    if (option === "user") {
      id = spawn("id", ["-u"]);
    } else if (option === "group") {
      id = spawn("id", ["-g"]);
    } else {
      return reject(new Error("Invalid option."));
    }

    id.stderr.on("error", (err: Error) => {
      return reject(err);
    });

    let data = "";
    const result: Partial<IdResult> = {};
    id.stdout.on("data", (chunk) => {
      data += chunk;
    });

    id.stdout.on("end", () => {
      result.id = data;
    });

    id.on("close", (code: number) => {
      result.code = code;
      resolve(result as IdResult);
    });
  });
}

async function getUidAndGid(): Promise<{ uid: number; gid: number }> {
  try {
    const uidProc = await runId("user");
    const gidProc = await runId("group");
    assertEquals(uidProc.code, 0);
    assertEquals(gidProc.code, 0);
    return {
      uid: parseInt(uidProc.id),
      gid: parseInt(gidProc.id),
    };
  } catch (error) {
    throw error;
  }
}

Deno.test({
  name: "chown() changes user and group ids",
  ignore: platform() === "win32" || isBun,
  fn: async () => {
    const { uid, gid } = await getUidAndGid();
    const tempFile = await makeTempFile({ prefix: "chown_" });

    // `chown` needs elevated privileges to change to different UIDs and GIDs.
    // Instead, pass the same IDs back to invoke `chown` and avoid erroring.
    await chown(tempFile, uid, gid);
    await remove(tempFile);
  },
});

Deno.test({
  name: "chown() handles `null` id arguments",
  ignore: platform() === "win32" || isBun,
  fn: async () => {
    const { uid, gid } = await getUidAndGid();
    const tempFile = await makeTempFile({ prefix: "chown_" });

    await chown(tempFile, uid, null);
    await chown(tempFile, null, gid);
    await remove(tempFile);
  },
});

Deno.test({
  name: "chown() rejects with NotFound for a non-existent file",
  ignore: platform() === "win32",
  fn: async () => {
    await assertRejects(async () => {
      await chown("non-existent-file.txt", null, null);
    }, NotFound);
  },
});

Deno.test({
  name: "chown() rejects with Error when called without elevated privileges",
  ignore: platform() === "win32",
  fn: async () => {
    const tempFile = await makeTempFile({ prefix: "chown_" });

    await assertRejects(async () => {
      await chown(tempFile, 0, 0);
    }, Error);

    await remove(tempFile);
  },
});

Deno.test({
  name: "chownSync() changes user and group ids",
  ignore: platform() === "win32" || isBun,
  fn: async () => {
    const { uid, gid } = await getUidAndGid();
    const tempFile = makeTempFileSync({ prefix: "chownSync_ " });

    // `chownSync` needs elevated privileges to change to different UIDs and
    // GIDs. Instead, pass the same IDs back to invoke `chownSync` and avoid
    // erroring.
    chownSync(tempFile, uid, gid);
    removeSync(tempFile);
  },
});

Deno.test({
  name: "chownSync() handles `null` id arguments",
  ignore: platform() === "win32" || isBun,
  fn: async () => {
    const { uid, gid } = await getUidAndGid();
    const tempFile = makeTempFileSync({ prefix: "chownSync_" });

    chownSync(tempFile, uid, null);
    chownSync(tempFile, null, gid);
    removeSync(tempFile);
  },
});

Deno.test({
  name: "chownSync() throws with NotFound for a non-existent file",
  ignore: platform() === "win32",
  fn: () => {
    assertThrows(() => {
      chownSync("non-existent-file.txt", null, null);
    }, NotFound);
  },
});

Deno.test({
  name: "chownSync() throws with Error when called without elevated privileges",
  ignore: platform() === "win32",
  fn: () => {
    const tempFile = makeTempFileSync({ prefix: "chownSync_" });

    assertThrows(() => {
      chownSync(tempFile, 0, 0);
    }, Error);

    removeSync(tempFile);
  },
});
