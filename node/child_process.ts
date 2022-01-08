// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// This module implements 'child_process' module of Node.JS API.
// ref: https://nodejs.org/api/child_process.html
import {
  ChildProcess,
  ChildProcessOptions,
  stdioStringToArray,
} from "./internal/child_process.ts";
import { validateString } from "./internal/validators.js";
import {
  ERR_CHILD_PROCESS_IPC_REQUIRED,
  ERR_INVALID_ARG_VALUE,
} from "./_errors.ts";
import { process } from "./process.ts";

const denoCompatArgv = [
  "run",
  "--compat",
  "--unstable",
  "--no-check",
  "--allow-all",
];
/**
 * Spawns a new Node.js process + fork.
 * @param modulePath
 * @param args
 * @param option
 * @returns {ChildProcess}
 */
export function fork(
  modulePath: string, /* args?: string[], options?: ForkOptions*/
) {
  validateString(modulePath, "modulePath");

  // Get options and args arguments.
  let execArgv;
  let options: SpawnOptions & {
    execArgv?: string;
    execPath?: string;
    silent?: boolean;
  } = {};
  let args: string[] = [];
  let pos = 1;
  if (pos < arguments.length && Array.isArray(arguments[pos])) {
    args = arguments[pos++];
  }

  if (pos < arguments.length && arguments[pos] == null) {
    pos++;
  }

  if (pos < arguments.length && arguments[pos] != null) {
    if (typeof arguments[pos] !== "object") {
      throw new ERR_INVALID_ARG_VALUE(`arguments[${pos}]`, arguments[pos]);
    }

    options = { ...arguments[pos++] };
  }

  // Prepare arguments for fork:
  execArgv = options.execArgv || process.execArgv;

  if (execArgv === process.execArgv && process._eval != null) {
    const index = execArgv.lastIndexOf(process._eval);
    if (index > 0) {
      // Remove the -e switch to avoid fork bombing ourselves.
      execArgv = execArgv.slice(0);
      execArgv.splice(index - 1, 2);
    }
  }

  args = [...denoCompatArgv, ...execArgv, modulePath, ...args];

  if (typeof options.stdio === "string") {
    options.stdio = stdioStringToArray(options.stdio, "ipc");
  } else if (!Array.isArray(options.stdio)) {
    // Use a separate fd=3 for the IPC channel. Inherit stdin, stdout,
    // and stderr from the parent if silent isn't set.
    options.stdio = stdioStringToArray(
      options.silent ? "pipe" : "inherit",
      "ipc",
    );
  } else if (!options.stdio.includes("ipc")) {
    throw new ERR_CHILD_PROCESS_IPC_REQUIRED("options.stdio");
  }

  options.execPath = options.execPath || Deno.execPath();
  options.shell = false;

  return spawn(options.execPath, args, options);
}

// deno-lint-ignore no-empty-interface
interface SpawnOptions extends ChildProcessOptions {}
export function spawn(command: string): ChildProcess;
export function spawn(command: string, options: SpawnOptions): ChildProcess;
export function spawn(command: string, args: string[]): ChildProcess;
export function spawn(
  command: string,
  args: string[],
  options: SpawnOptions,
): ChildProcess;
/**
 * Spawns a child process using `command`.
 */
export function spawn(
  command: string,
  argsOrOptions?: string[] | SpawnOptions,
  maybeOptions?: SpawnOptions,
): ChildProcess {
  const args = Array.isArray(argsOrOptions) ? argsOrOptions : [];
  const options = !Array.isArray(argsOrOptions) && argsOrOptions != null
    ? argsOrOptions
    : maybeOptions;
  return new ChildProcess(command, args, options);
}

export function execFile() {
  throw new Error("not implemented");
}

export default { fork, spawn, execFile, ChildProcess };
