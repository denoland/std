// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
const { env, stdin } = Deno;
import * as path from "../fs/path.ts";

const decoder = new TextDecoder("utf-8");
// Regular expression to test disk driver letter. eg "C:\\User\username\path\to"
const driverLetterReg = /^[c-z]:/i;
export const isWindows = Deno.platform.os === "win";

export function getInstallerDir(): string {
  // In Windows's Powershell $HOME environmental variable maybe null
  // if so use $HOMEPATH instead.
  let { HOME, HOMEPATH } = env();

  const HOME_PATH = HOME || HOMEPATH;

  if (!HOME_PATH) {
    throw new Error("$HOME is not defined.");
  }

  return path.join(HOME_PATH, ".deno", "bin");
}

async function readCharacter(): Promise<string> {
  const byteArray = new Uint8Array(1024);
  await stdin.read(byteArray);
  const line = decoder.decode(byteArray);
  return line[0];
}

export async function yesNoPrompt(message: string): Promise<boolean> {
  console.log(`${message} [yN]`);
  const input = await readCharacter();
  console.log();
  return input === "y" || input === "Y";
}

export function checkIfExistsInPath(filePath: string): boolean {
  // In Windows's Powershell $PATH not exist, so use $Path instead.
  // $HOMEDRIVE is only used on Windows.
  const { PATH, Path, HOMEDRIVE } = env();

  let envPath = (PATH as string) || (Path as string) || "";

  const paths = envPath.split(isWindows ? ";" : ":");

  let fileAbsolutePath = filePath;

  for (const p of paths) {
    const pathInEnv = path.normalize(p);
    // On Windows paths from env contain drive letter.
    // (eg. C:\Users\username\.deno\bin)
    // But in the path of Deno, there is no drive letter.
    // (eg \Users\username\.deno\bin)
    if (isWindows) {
      if (driverLetterReg.test(pathInEnv)) {
        fileAbsolutePath = HOMEDRIVE + "\\" + fileAbsolutePath;
      }
    }
    if (pathInEnv === fileAbsolutePath) {
      return true;
    }
    fileAbsolutePath = filePath;
  }

  return false;
}

export function validateModuleName(moduleName: string): boolean {
  if (/^[a-z][\w-]*$/i.test(moduleName)) {
    return true;
  } else {
    throw new Error("Invalid module name: " + moduleName);
  }
}
