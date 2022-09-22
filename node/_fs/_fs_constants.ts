// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { fs } from "../internal_binding/constants.ts";

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
} = fs;
