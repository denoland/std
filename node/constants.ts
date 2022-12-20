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
  O_RDONLY,
  O_WRONLY,
  O_RDWR,
  O_NOCTTY,
  O_TRUNC,
  O_APPEND,
  O_DIRECTORY,
  O_NOFOLLOW,
  O_SYNC,
  O_DSYNC,
  O_SYMLINK,
  O_NONBLOCK,
  O_CREAT,
  O_EXCL,
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
  RTLD_DEEPBIND,
  RTLD_GLOBAL,
  RTLD_LAZY,
  RTLD_LOCAL,
  RTLD_NOW,
} = osConstants.dlopen;
export const {
  E2BIG,
  EACCES,
  EADDRINUSE,
  EADDRNOTAVAIL,
  EAFNOSUPPORT,
  EAGAIN,
  EALREADY,
  EBADF,
  EBADMSG,
  EBUSY,
  ECANCELED,
  ECHILD,
  ECONNABORTED,
  ECONNREFUSED,
  ECONNRESET,
  EDEADLK,
  EDESTADDRREQ,
  EDOM,
  EDQUOT,
  EEXIST,
  EFAULT,
  EFBIG,
  EHOSTUNREACH,
  EIDRM,
  EILSEQ,
  EINPROGRESS,
  EINTR,
  EINVAL,
  EIO,
  EISCONN,
  EISDIR,
  ELOOP,
  EMFILE,
  EMLINK,
  EMSGSIZE,
  EMULTIHOP,
  ENAMETOOLONG,
  ENETDOWN,
  ENETRESET,
  ENETUNREACH,
  ENFILE,
  ENOBUFS,
  ENODATA,
  ENODEV,
  ENOENT,
  ENOEXEC,
  ENOLCK,
  ENOLINK,
  ENOMEM,
  ENOMSG,
  ENOPROTOOPT,
  ENOSPC,
  ENOSR,
  ENOSTR,
  ENOSYS,
  ENOTCONN,
  ENOTDIR,
  ENOTEMPTY,
  ENOTSOCK,
  ENOTSUP,
  ENOTTY,
  ENXIO,
  EOPNOTSUPP,
  EOVERFLOW,
  EPERM,
  EPIPE,
  EPROTO,
  EPROTONOSUPPORT,
  EPROTOTYPE,
  ERANGE,
  EROFS,
  ESPIPE,
  ESRCH,
  ESTALE,
  ETIME,
  ETIMEDOUT,
  ETXTBSY,
  EWOULDBLOCK,
  EXDEV,
} = osConstants.errno;
export const {
  PRIORITY_ABOVE_NORMAL,
  PRIORITY_BELOW_NORMAL,
  PRIORITY_HIGH,
  PRIORITY_HIGHEST,
  PRIORITY_LOW,
  PRIORITY_NORMAL,
} = osConstants.priority;
export const {
  SIGABRT,
  SIGALRM,
  SIGBUS,
  SIGCHLD,
  SIGCONT,
  SIGFPE,
  SIGHUP,
  SIGILL,
  SIGINT,
  SIGIO,
  SIGIOT,
  SIGKILL,
  SIGPIPE,
  SIGPOLL,
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
  SIGUNUSED,
  SIGURG,
  SIGUSR1,
  SIGUSR2,
  SIGVTALRM,
  SIGWINCH,
  SIGXCPU,
  SIGXFSZ,
} = osConstants.signals;
