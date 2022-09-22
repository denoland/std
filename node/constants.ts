// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

// Based on: https://github.com/nodejs/node/blob/0646eda/lib/constants.js

import { constants as fsConstants } from "./fs.ts";
import { constants as osConstants } from "./os.ts";

export default {
  ...fsConstants,
  ...osConstants.dlopen,
  ...osConstants.errno,
  ...osConstants.signals,
  ...osConstants.priority,
};

export const {
  F_OK,
  R_OK,
  W_OK,
  X_OK,
  S_IRUSR,
  S_IWUSR,
  S_IXUSR,
  S_IRGRP,
  S_IWGRP,
  S_IXGRP,
  S_IROTH,
  S_IWOTH,
  S_IXOTH,
  COPYFILE_EXCL,
  COPYFILE_FICLONE,
  COPYFILE_FICLONE_FORCE,
  UV_FS_COPYFILE_EXCL,
  UV_FS_COPYFILE_FICLONE,
  UV_FS_COPYFILE_FICLONE_FORCE,
} = fsConstants;
export const {
  SIGABRT,
  SIGALRM,
  SIGBREAK,
  SIGBUS,
  SIGCHLD,
  SIGCONT,
  SIGEMT,
  SIGFPE,
  SIGHUP,
  SIGILL,
  SIGINFO,
  SIGINT,
  SIGIO,
  SIGKILL,
  SIGPIPE,
  SIGPROF,
  SIGPWR,
  SIGQUIT,
  SIGSEGV,
  SIGSTKFLT,
  SIGSTOP,
  SIGSYS,
  SIGTERM,
  SIGTRAP,
  SIGTSTP,
  SIGTTIN,
  SIGTTOU,
  SIGURG,
  SIGUSR1,
  SIGUSR2,
  SIGVTALRM,
  SIGWINCH,
  SIGXCPU,
  SIGXFSZ,
} = osConstants.signals;
