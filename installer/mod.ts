#!/usr/bin/env deno --allow-all

const {
  args,
  env,
  readDirSync,
  mkdirSync,
  writeFileSync,
  exit,
  stdin,
  run
} = Deno;
import * as path from "../fs/path.ts";
import { parse } from "./shebang.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

enum Permission {
  Unknown,
  Read,
  Write,
  Net,
  Env,
  Run,
  All
}

function getPermissionFromFlag(flag: string): Permission {
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
  return Permission.Unknown;
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
  const decoder = new TextDecoder("utf-8");
  const byteArray = new Uint8Array(1024);
  await stdin.read(byteArray);
  const line = decoder.decode(byteArray);
  return line[0];
}

async function grantPermission(
  perm: Permission,
  moduleName: string = "Deno"
): Promise<boolean> {
  let msg = `${moduleName} requests `;
  switch (perm) {
    case Permission.Read:
      msg += "read access to file system. ";
      break;
    case Permission.Write:
      msg += "write access to file system. ";
      break;
    case Permission.Net:
      msg += "network access. ";
      break;
    case Permission.Env:
      msg += "access to environment variable. ";
      break;
    case Permission.Run:
      msg += "access to run a subprocess. ";
      break;
    case Permission.All:
      msg += "all available access. ";
      break;
    default:
      return false;
  }
  msg += "Grant permanently? [yN]";
  console.log(msg);

  const input = await readCharacter();
  if (input !== "y" && input !== "Y") {
    return false;
  }
  return true;
}

function createDirIfNotExists(path: string) {
  try {
    readDirSync(path);
  } catch (e) {
    mkdirSync(path);
  }
}

function getInstallerHome(): string {
  const { DENO_DIR, HOME } = env();
  if (!HOME && !DENO_DIR) {
    throw new Error("$DENO_DIR and $HOME are not defined.");
  }
  if (DENO_DIR) {
    return path.join(DENO_DIR, "bin");
  }
  return path.join(HOME, ".deno", "bin");
}

// TODO: `Response` is not exposed in global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWithRedirects(
  url: string,
  redirectLimit: number = 10
): Promise<any> {
  const response = await fetch(url);

  if (response.status === 301 || response.status === 302) {
    if (redirectLimit > 0) {
      const redirectUrl = response.headers.get("location");
      return await fetchWithRedirects(redirectUrl, redirectLimit - 1);
    }
  }

  return response;
}

async function main() {
  const INSTALLER_HOME = getInstallerHome();

  const modulePath: string = args[args.length - 1];
  if (!modulePath.startsWith("http")) {
    throw new Error("module path is not correct.");
  }
  const moduleName = path.basename(modulePath, ".ts");

  console.log(`Downloading: ${modulePath}`);
  const response = await fetchWithRedirects(modulePath);

  if (response.status !== 200) {
    throw new Error(`Failed to get remote script: ${modulePath}`);
  }
  const body = await Deno.readAll(response.body);
  const moduleText = decoder.decode(body);
  console.log("Download complete.");

  createDirIfNotExists(INSTALLER_HOME);
  const FILE_PATH = path.join(INSTALLER_HOME, moduleName);

  const shebang = parse(moduleText.split("\n")[0]);

  const grantedPermissions: Array<Permission> = [];
  for (const flag of shebang.args) {
    const permission = getPermissionFromFlag(flag);
    if (permission === Permission.Unknown) {
      continue;
    }
    if (!(await grantPermission(permission, moduleName))) {
      continue;
    }
    grantedPermissions.push(permission);
  }
  const commands = [
    "deno",
    ...grantedPermissions.map(getFlagFromPermission),
    modulePath,
    "$@"
  ];

  writeFileSync(FILE_PATH, encoder.encode("#/bin/sh\n"));
  writeFileSync(FILE_PATH, encoder.encode(commands.join(" ")));

  const makeExecutable = run({ args: ["chmod", "+x", FILE_PATH] });
  await makeExecutable.status();
  makeExecutable.close();

  console.log(`Successfully installed ${moduleName}.`);
}

try {
  main();
} catch (e) {
  const err = e as Error;
  if (err.message) {
    console.log(err.message);
    exit(1);
  }
  console.log(e);
  exit(1);
}
