// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Encodings, notImplemented } from "../_utils.ts";
import { fromFileUrl } from "../path.ts";
import { Buffer } from "../buffer.ts";
import { writeAllSync } from "../../streams/conversion.ts";
import {
  CallbackWithError,
  checkEncoding,
  getEncoding,
  getOpenOptions,
  isFileOptions,
  WriteFileOptions,
} from "./_fs_common.ts";
import { isWindows } from "../../_util/os.ts";
import { AbortError, uvException } from "../_errors.ts";

export function writeFile(
  pathOrRid: string | number | URL,
  data: string | Uint8Array,
  optOrCallback: Encodings | CallbackWithError | WriteFileOptions | undefined,
  callback?: CallbackWithError,
): void {
  const callbackFn: CallbackWithError | undefined =
    optOrCallback instanceof Function ? optOrCallback : callback;
  const options: Encodings | WriteFileOptions | undefined =
    optOrCallback instanceof Function ? undefined : optOrCallback;

  if (!callbackFn) {
    throw new TypeError("Callback must be a function.");
  }

  pathOrRid = pathOrRid instanceof URL ? fromFileUrl(pathOrRid) : pathOrRid;

  const flag: string | undefined = isFileOptions(options)
    ? options.flag
    : undefined;

  const mode: number | undefined = isFileOptions(options)
    ? options.mode
    : undefined;

  const encoding = checkEncoding(getEncoding(options)) || "utf8";
  const openOptions = getOpenOptions(flag || "w");

  if (typeof data === "string") data = Buffer.from(data, encoding);

  const isRid = typeof pathOrRid === "number";
  let file;

  let error: Error | null = null;
  (async () => {
    try {
      file = isRid
        ? new Deno.File(pathOrRid as number)
        : await Deno.open(pathOrRid as string, openOptions);

      if (!isRid && mode) {
        if (isWindows) notImplemented(`"mode" on Windows`);
        await Deno.chmod(pathOrRid as string, mode);
      }

      const signal: AbortSignal | undefined = isFileOptions(options)
        ? options.signal
        : undefined;
      await writeAll(file, data as Uint8Array, { signal });
    } catch (e) {
      error = e instanceof Error
        ? convertDenoErrorToNodeError(e)
        : new Error("[non-error thrown]");
    } finally {
      // Make sure to close resource
      if (!isRid && file) file.close();
      callbackFn(error);
    }
  })();
}

export function writeFileSync(
  pathOrRid: string | number | URL,
  data: string | Uint8Array,
  options?: Encodings | WriteFileOptions,
): void {
  pathOrRid = pathOrRid instanceof URL ? fromFileUrl(pathOrRid) : pathOrRid;

  const flag: string | undefined = isFileOptions(options)
    ? options.flag
    : undefined;

  const mode: number | undefined = isFileOptions(options)
    ? options.mode
    : undefined;

  const encoding = checkEncoding(getEncoding(options)) || "utf8";
  const openOptions = getOpenOptions(flag || "w");

  if (typeof data === "string") data = Buffer.from(data, encoding);

  const isRid = typeof pathOrRid === "number";
  let file;

  let error: Error | null = null;
  try {
    file = isRid
      ? new Deno.File(pathOrRid as number)
      : Deno.openSync(pathOrRid as string, openOptions);

    if (!isRid && mode) {
      if (isWindows) notImplemented(`"mode" on Windows`);
      Deno.chmodSync(pathOrRid as string, mode);
    }

    writeAllSync(file, data as Uint8Array);
  } catch (e) {
    error = e instanceof Error
      ? convertDenoErrorToNodeError(e)
      : new Error("[non-error thrown]");
  } finally {
    // Make sure to close resource
    if (!isRid && file) file.close();
  }

  if (error) throw error;
}

interface WriteAllOptions {
  offset?: number;
  length?: number;
  signal?: AbortSignal;
}
async function writeAll(
  w: Deno.Writer,
  arr: Uint8Array,
  options: WriteAllOptions = {},
) {
  const { offset = 0, length = arr.byteLength, signal } = options;
  checkAborted(signal);

  const written = await w.write(arr.subarray(offset, offset + length));

  if (written === length) {
    return;
  }

  await writeAll(w, arr, {
    offset: offset + written,
    length: length - written,
    signal,
  });
}

function checkAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new AbortError();
  }
}

function convertDenoErrorToNodeError(e: Error) {
  const errno = extractOsErrorNumberFromErrorMessage(e);
  if (typeof errno === "undefined") {
    return e;
  }

  const ex = uvException({
    errno: -errno,
    syscall: "writeFile",
  });
  return ex;
}

function extractOsErrorNumberFromErrorMessage(e: unknown): number | undefined {
  const match = e instanceof Error
    ? e.message.match(/\(os error (\d+)\)/)
    : false;

  if (match) {
    return +match[1];
  }

  return undefined;
}
