import { promisify } from './util.ts';
import * as fs from './fs.ts';

export const access = promisify(fs.access);
export const copyFile = promisify(fs.copyFile);
export const open = promisify(fs.open);
// export const opendir = promisify(fs.opendir);
export const rename = promisify(fs.rename);
export const truncate = promisify(fs.truncate);
// export const rm = promisify(fs.rm);
export const rmdir = promisify(fs.rmdir);
export const mkdir = promisify(fs.mkdir);
export const readdir = promisify(fs.readdir);
export const readlink = promisify(fs.readlink);
export const symlink = promisify(fs.symlink);
export const lstat = promisify(fs.lstat);
export const stat = promisify(fs.stat);
export const link = promisify(fs.link);
export const unlink = promisify(fs.unlink);
export const chmod = promisify(fs.chmod);
// export const lchmod = promisify(fs.lchmod);
// export const lchown = promisify(fs.lchown);
export const chown = promisify(fs.chown);
export const utimes = promisify(fs.utimes);
// export const lutimes = promisify(fs.lutimes);
export const realpath = promisify(fs.realpath);
export const mkdtemp = promisify(fs.mkdtemp);
export const writeFile = promisify(fs.writeFile);
export const appendFile = promisify(fs.appendFile);
export const readFile = promisify(fs.readFile);
export const watch = promisify(fs.watch);

export default {
  open,
  // opendir,
  rename,
  truncate,
  // rm,
  rmdir,
  mkdir,
  readdir,
  readlink,
  symlink,
  lstat,
  stat,
  link,
  unlink,
  chmod,
  // lchmod,
  // lchown,
  chown,
  utimes,
  // lutimes,
  realpath,
  mkdtemp,
  writeFile,
  appendFile,
  readFile,
  watch
};
