#!/usr/bin/env deno --allow-all
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
const { env, readDirSync, mkdirSync, writeFile, stdin, chmod, run } = Deno;
import * as path from "../fs/path.ts";
import { exists } from "../fs/exists.ts";
import { getInstallerDir } from "./util.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");
const isWindows = Deno.platform.os === "win";
// Regular expression to test disk driver letter. eg "C:\\User\username\path\to"
const driverLetterReg = /^[c-z]:/i;

enum Permission {
  Read,
  Write,
  Net,
  Env,
  Run,
  All
}

function getPermissionFromFlag(flag: string): Permission | undefined {
  switch (flag) {
    case "--allow-read":
      return Permission.Read;
    case "--allow-write":
      return Permission.Write;
    case "--allow-net":
      return Permission.Net;
    case "--allow-env":
      return Permission.Env;
    case "--allow-run":
      return Permission.Run;
    case "--allow-all":
      return Permission.All;
    case "-A":
      return Permission.All;
  }
}

function getFlagFromPermission(perm: Permission): string {
  switch (perm) {
    case Permission.Read:
      return "--allow-read";
    case Permission.Write:
      return "--allow-write";
    case Permission.Net:
      return "--allow-net";
    case Permission.Env:
      return "--allow-env";
    case Permission.Run:
      return "--allow-run";
    case Permission.All:
      return "--allow-all";
  }
  return "";
}

async function readCharacter(): Promise<string> {
  const byteArray = new Uint8Array(1024);
  await stdin.read(byteArray);
  const line = decoder.decode(byteArray);
  return line[0];
}

async function yesNoPrompt(message: string): Promise<boolean> {
  console.log(`${message} [yN]`);
  const input = await readCharacter();
  console.log();
  return input === "y" || input === "Y";
}

function createDirIfNotExists(path: string): void {
  try {
    readDirSync(path);
  } catch (e) {
    mkdirSync(path, true);
  }
}

function checkIfExistsInPath(filePath: string): boolean {
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

async function generateExecutable(
  filePath: string,
  commands: string[]
): Promise<void> {
  commands = commands.map((v): string => JSON.stringify(v));
  // On Windows if user is using Powershell .cmd extension is need to run the
  // installed module.
  // Generate batch script to satisfy that.
  const templateHeader =
    "This executable is generated by Deno. Please don't modify it unless you " +
    "know what it means.";
  if (isWindows) {
    const template = `% ${templateHeader} %
@IF EXIST "%~dp0\deno.exe" (
  "%~dp0\deno.exe" ${commands.slice(1).join(" ")} %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.TS;=;%
  ${commands.join(" ")} %*
)
`;
    const cmdFile = filePath + ".cmd";
    await writeFile(cmdFile, encoder.encode(template));
    await chmod(cmdFile, 0o755);
  }

  // generate Shell script
  const template = `#/bin/sh
# ${templateHeader}
basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")

case \`uname\` in
  *CYGWIN*) basedir=\`cygpath -w "$basedir"\`;;
esac

if [ -x "$basedir/deno" ]; then
  "$basedir/deno" ${commands.slice(1).join(" ")} "$@"
  ret=$?
else
  ${commands.join(" ")} "$@"
  ret=$?
fi
exit $ret
`;
  await writeFile(filePath, encoder.encode(template));
  await chmod(filePath, 0o755);
}

export async function install(
  moduleName: string,
  moduleUrl: string,
  flags: string[]
): Promise<void> {
  const installerDir = getInstallerDir();
  createDirIfNotExists(installerDir);

  const filePath = path.join(installerDir, moduleName);

  if (await exists(filePath)) {
    const msg =
      "⚠️  ${moduleName} is already installed, " +
      "do you want to overwrite it?";
    if (!(await yesNoPrompt(msg))) {
      return;
    }
  }

  // ensure script that is being installed exists
  const ps = run({
    args: ["deno", "fetch", "--reload", moduleUrl],
    stdout: "inherit",
    stderr: "inherit"
  });

  const { code } = await ps.status();

  if (code !== 0) {
    throw new Error("Failed to fetch module.");
  }

  const grantedPermissions: Permission[] = [];
  const scriptArgs: string[] = [];

  for (const flag of flags) {
    const permission = getPermissionFromFlag(flag);
    if (permission === undefined) {
      scriptArgs.push(flag);
    } else {
      grantedPermissions.push(permission);
    }
  }

  // if install local module
  if (!/^https?:\/\//.test(moduleUrl)) {
    moduleUrl = path.resolve(moduleUrl);
  }

  const commands = [
    "deno",
    "run",
    ...grantedPermissions.map(getFlagFromPermission),
    moduleUrl,
    ...scriptArgs
  ];

  await generateExecutable(filePath, commands);

  console.log(`✅ Successfully installed ${moduleName}`);
  console.log(filePath);

  if (!checkIfExistsInPath(installerDir)) {
    console.log("\nℹ️  Add ~/.deno/bin to PATH");
    console.log(
      "    echo 'export PATH=\"$HOME/.deno/bin:$PATH\"' >> ~/.bashrc # change" +
        " this to your shell"
    );
  }
}
