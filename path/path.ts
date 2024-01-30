import { basename } from "./basename.ts";
import { dirname } from "./dirname.ts";
import { extname } from "./extname.ts";
import { fromFileUrl } from "./from_file_url.ts";
import { isAbsolute } from "./is_absolute.ts";
import { join } from "./join.ts";
import { normalize } from "./normalize.ts";
import { relative } from "./relative.ts";
import { resolve } from "./resolve.ts";
import { toFileUrl } from "./to_file_url.ts";

export class Path {
  readonly #path: string;
  #knownResolved = false;

  /** This is a special symbol that allows different versions of
   * deno_std's `Path` API to match on `instanceof` checks. Ideally
   * people shouldn't be mixing versions, but if it happens then
   * this will maybe reduce some bugs.
   * @internal
   */
  private static instanceofSymbol = Symbol.for("deno_std.Path");

  constructor(path: string | URL | Path) {
    if (path instanceof URL) {
      this.#path = fromFileUrl(path);
    } else if (path instanceof Path) {
      this.#path = path.toString();
    } else if (typeof path === "string") {
      if (path.startsWith("file://")) {
        this.#path = fromFileUrl(path);
      } else {
        this.#path = path;
      }
    } else {
      throw new Error("todo... decide on behaviour");
    }
  }

  /** @internal */
  static [Symbol.hasInstance](instance: unknown): boolean {
    // this should never change because it should work accross versions
    return (instance?.constructor as typeof Path)?.instanceofSymbol ===
      Path.instanceofSymbol;
  }

  /** @internal */
  [Symbol.for("Deno.customInspect")](): string {
    return `Path("${this.#path}")`;
  }

  /** Gets the string representation of this path. */
  toString(): string {
    return this.#path;
  }

  /** Resolves the path and gets the file URL. */
  toFileUrl(): URL {
    const resolvedPath = this.resolve();
    return toFileUrl(resolvedPath.toString());
  }

  /** If this path reference is the same as another one. */
  equals(otherPath: Path): boolean {
    return this.resolve().toString() === otherPath.resolve().toString();
  }

  /** Follows symlinks and gets if this path is a directory. */
  isDirSync(): boolean {
    return this.statSync()?.isDirectory ?? false;
  }

  /** Follows symlinks and gets if this path is a file. */
  isFileSync(): boolean {
    return this.statSync()?.isFile ?? false;
  }

  /** Gets if this path is a symlink. */
  isSymlinkSync(): boolean {
    return this.lstatSync()?.isSymlink ?? false;
  }

  /** Gets if this path is an absolute path. */
  isAbsolute(): boolean {
    return isAbsolute(this.#path);
  }

  /** Gets if this path is relative. */
  isRelative(): boolean {
    return !this.isAbsolute();
  }

  /** Joins the provided path segments onto this path. */
  join(...pathSegments: string[]): Path {
    return new Path(join(this.#path, ...pathSegments));
  }

  /** Resolves this path to an absolute path along with the provided path segments. */
  resolve(...pathSegments: string[]): Path {
    if (this.#knownResolved && pathSegments.length === 0) {
      return this;
    }

    const resolvedPath = resolve(this.#path, ...pathSegments);
    if (pathSegments.length === 0 && resolvedPath === this.#path) {
      this.#knownResolved = true;
      return this;
    } else {
      const pathRef = new Path(resolvedPath);
      pathRef.#knownResolved = true;
      return pathRef;
    }
  }

  /**
   * Normalizes the `path`, resolving `'..'` and `'.'` segments.
   * Note that resolving these segments does not necessarily mean that all will be eliminated.
   * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
   */
  normalize(): Path {
    return new Path(normalize(this.#path));
  }

  /** Resolves the `Deno.FileInfo` of this path following symlinks. */
  async stat(): Promise<Deno.FileInfo | undefined> {
    try {
      return await Deno.stat(this.#path);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return undefined;
      } else {
        throw err;
      }
    }
  }

  /** Synchronously resolves the `Deno.FileInfo` of this
   * path following symlinks. */
  statSync(): Deno.FileInfo | undefined {
    try {
      return Deno.statSync(this.#path);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return undefined;
      } else {
        throw err;
      }
    }
  }

  /** Resolves the `Deno.FileInfo` of this path without
   * following symlinks. */
  async lstat(): Promise<Deno.FileInfo | undefined> {
    try {
      return await Deno.lstat(this.#path);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return undefined;
      } else {
        throw err;
      }
    }
  }

  /** Synchronously resolves the `Deno.FileInfo` of this path
   * without following symlinks. */
  lstatSync(): Deno.FileInfo | undefined {
    try {
      return Deno.lstatSync(this.#path);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return undefined;
      } else {
        throw err;
      }
    }
  }

  /**
   * Gets the directory path. In most cases, it is recommended
   * to use `.parent()` instead since it will give you a `PathRef`.
   */
  dirname(): string {
    return dirname(this.#path);
  }

  /** Gets the file or directory name of the path. */
  basename(): string {
    return basename(this.#path);
  }

  /** Resolves the path getting all its ancestor directories in order. */
  *ancestors(): Generator<Path> {
    let ancestor = this.parent();
    while (ancestor != null) {
      yield ancestor;
      ancestor = ancestor.parent();
    }
  }

  *components(): Generator<string> {
    const path = this.normalize();
    let last_index = 0;

    // yield the prefix
    if (path.#path.startsWith("\\\\?\\")) {
      last_index = nextSlash(path.#path, 4);
      if (last_index === -1) {
        yield path.#path;
        return;
      } else {
        yield path.#path.substring(0, last_index);
        last_index += 1; // move past next slash
      }
    } else if (path.#path.startsWith("/")) {
      // move past the initial slash
      last_index += 1;
    }

    while (true) {
      const index = nextSlash(path.#path, last_index);
      if (index < 0) {
        const part = path.#path.substring(last_index);
        if (part.length > 0) {
          yield part;
        }
        return;
      }
      yield path.#path.substring(last_index, index);
      last_index = index + 1;
    }

    function nextSlash(path: string, start: number) {
      for (let i = start; i < path.length; i++) {
        const c = path.charCodeAt(i);
        if (c === 47 || c === 92) {
          return i;
        }
      }
      return -1;
    }
  }

  // This is private because this doesn't handle stuff like `\\?\` at the start
  // so it's only used internally with #endsWith for perf. API consumers should
  // use .components()
  *#rcomponents(): Generator<string> {
    const path = this.normalize();
    let last_index = undefined;
    while (last_index == null || last_index > 0) {
      const index = nextSlash(
        path.#path,
        last_index == null ? undefined : last_index - 1,
      );
      if (index < 0) {
        const part = path.#path.substring(0, last_index);
        if (part.length > 0) {
          yield part;
        }
        return;
      }
      const part = path.#path.substring(index + 1, last_index);
      if (last_index != null || part.length > 0) {
        yield part;
      }
      last_index = index;
    }

    function nextSlash(path: string, start: number | undefined) {
      for (let i = start ?? path.length - 1; i >= 0; i--) {
        const c = path.charCodeAt(i);
        if (c === 47 || c === 92) {
          return i;
        }
      }
      return -1;
    }
  }

  startsWith(path: Path | URL | string): boolean {
    const startsWithComponents = ensurePath(path).components();
    for (const component of this.components()) {
      const next = startsWithComponents.next();
      if (next.done) {
        return true;
      }
      if (next.value !== component) {
        return false;
      }
    }
    return startsWithComponents.next().done ?? true;
  }

  endsWith(path: Path | URL | string): boolean {
    const endsWithComponents = ensurePath(path).#rcomponents();
    for (const component of this.#rcomponents()) {
      const next = endsWithComponents.next();
      if (next.done) {
        return true;
      }
      if (next.value !== component) {
        return false;
      }
    }
    return endsWithComponents.next().done ?? true;
  }

  /** Gets the parent directory or returns undefined if the parent is the root directory. */
  parent(): Path | undefined {
    const resolvedPath = this.resolve();
    const dirname = resolvedPath.dirname();
    if (dirname === resolvedPath.#path) {
      return undefined;
    } else {
      return new Path(dirname);
    }
  }

  /** Gets the parent or throws if the current directory was the root. */
  parentOrThrow(): Path {
    const parent = this.parent();
    if (parent == null) {
      throw new Error(`Cannot get the parent directory of '${this.#path}'.`);
    }
    return parent;
  }

  /**
   * Returns the extension of the path with leading period or undefined
   * if there is no extension.
   */
  extname(): string | undefined {
    const extName = extname(this.#path);
    return extName.length === 0 ? undefined : extName;
  }

  /** Gets a new path reference with the provided extension. */
  withExtname(ext: string): Path {
    const currentExt = this.extname();
    const hasLeadingPeriod = ext.charCodeAt(0) === /* period */ 46;
    if (!hasLeadingPeriod && ext.length !== 0) {
      ext = "." + ext;
    }
    return new Path(
      this.#path.substring(0, this.#path.length - (currentExt?.length ?? 0)) +
        ext,
    );
  }

  /** Gets a new path reference with the provided file or directory name. */
  withBasename(basename: string): Path {
    const currentBaseName = this.basename();
    return new Path(
      this.#path.substring(0, this.#path.length - currentBaseName.length) +
        basename,
    );
  }

  /** Gets the relative path from this path to the specified path. */
  relative(to: string | URL | Path): string {
    const toPathRef = ensurePath(to);
    return relative(this.resolve().#path, toPathRef.resolve().#path);
  }

  /** Gets if the path exists. Beware of TOCTOU issues. */
  exists(): Promise<boolean> {
    return this.lstat().then((info) => info != null);
  }

  /** Synchronously gets if the path exists. Beware of TOCTOU issues. */
  existsSync(): boolean {
    return this.lstatSync() != null;
  }

  /** Resolves to the absolute normalized path, with symbolic links resolved. */
  realPath(): Promise<Path> {
    return Deno.realPath(this.#path).then((path) => new Path(path));
  }

  /** Synchronously resolves to the absolute normalized path, with symbolic links resolved. */
  realPathSync(): Path {
    return new Path(Deno.realPathSync(this.#path));
  }

  /** Creates a directory at this path.
   * @remarks By default, this is recursive.
   */
  async mkdir(options?: Deno.MkdirOptions): Promise<this> {
    await Deno.mkdir(this.#path, {
      recursive: true,
      ...options,
    });
    return this;
  }

  /** Synchronously creates a directory at this path.
   * @remarks By default, this is recursive.
   */
  mkdirSync(options?: Deno.MkdirOptions): this {
    Deno.mkdirSync(this.#path, {
      recursive: true,
      ...options,
    });
    return this;
  }

  /** Reads the entries in the directory. */
  readDir(): AsyncIterable<Deno.DirEntry> {
    const dir = this.resolve();
    return Deno.readDir(dir.#path);
  }

  /** Synchronously reads the entries in the directory. */
  readDirSync(): Iterable<Deno.DirEntry> {
    const dir = this.resolve();
    return Deno.readDirSync(dir.#path);
  }

  /** Reads the bytes from the file. */
  readBytes(options?: Deno.ReadFileOptions): Promise<Uint8Array> {
    return Deno.readFile(this.#path, options);
  }

  /** Synchronously reads the bytes from the file. */
  readBytesSync(): Uint8Array {
    return Deno.readFileSync(this.#path);
  }

  /** Calls `.readBytes()`, but returns undefined if the path doesn't exist. */
  readMaybeBytes(
    options?: Deno.ReadFileOptions,
  ): Promise<Uint8Array | undefined> {
    return notFoundToUndefined(() => this.readBytes(options));
  }

  /** Calls `.readBytesSync()`, but returns undefined if the path doesn't exist. */
  readMaybeBytesSync(): Uint8Array | undefined {
    return notFoundToUndefinedSync(() => this.readBytesSync());
  }

  /** Reads the text from the file. */
  readText(options?: Deno.ReadFileOptions): Promise<string> {
    return Deno.readTextFile(this.#path, options);
  }

  /** Synchronously reads the text from the file. */
  readTextSync(): string {
    return Deno.readTextFileSync(this.#path);
  }

  /** Calls `.readText()`, but returns undefined when the path doesn't exist.
   * @remarks This still errors for other kinds of errors reading a file.
   */
  readMaybeText(options?: Deno.ReadFileOptions): Promise<string | undefined> {
    return notFoundToUndefined(() => this.readText(options));
  }

  /** Calls `.readTextSync()`, but returns undefined when the path doesn't exist.
   * @remarks This still errors for other kinds of errors reading a file.
   */
  readMaybeTextSync(): string | undefined {
    return notFoundToUndefinedSync(() => this.readTextSync());
  }

  /** Reads and parses the file as JSON, throwing if it doesn't exist or is not valid JSON. */
  async readJson<T>(options?: Deno.ReadFileOptions): Promise<T> {
    return this.#parseJson<T>(await this.readText(options));
  }

  /** Synchronously reads and parses the file as JSON, throwing if it doesn't
   * exist or is not valid JSON. */
  readJsonSync<T>(): T {
    return this.#parseJson<T>(this.readTextSync());
  }

  #parseJson<T>(text: string) {
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      throw new Error(`Failed parsing JSON in '${this.toString()}'.`, {
        cause: err,
      });
    }
  }

  /**
   * Calls `.readJson()`, but returns undefined if the file doesn't exist.
   * @remarks This method will still throw if the file cannot be parsed as JSON.
   */
  readMaybeJson<T>(options?: Deno.ReadFileOptions): Promise<T | undefined> {
    return notFoundToUndefined(() => this.readJson<T>(options));
  }

  /**
   * Calls `.readJsonSync()`, but returns undefined if the file doesn't exist.
   * @remarks This method will still throw if the file cannot be parsed as JSON.
   */
  readMaybeJsonSync<T>(): T | undefined {
    return notFoundToUndefinedSync(() => this.readJsonSync<T>());
  }

  /** Writes out the provided bytes to the file. */
  async write(
    data: Uint8Array,
    options?: Deno.WriteFileOptions,
  ): Promise<this> {
    await this.#withFileForWriting(options, (file) => file.write(data));
    return this;
  }

  /** Synchronously writes out the provided bytes to the file. */
  writeSync(data: Uint8Array, options?: Deno.WriteFileOptions): this {
    this.#withFileForWritingSync(options, (file) => {
      file.writeSync(data);
    });
    return this;
  }

  /** Writes out the provided text to the file. */
  async writeText(
    text: string,
    options?: Deno.WriteFileOptions,
  ): Promise<this> {
    await this.#withFileForWriting(
      options,
      (file) => writeTextToFile(file, text),
    );
    return this;
  }

  /** Synchronously writes out the provided text to the file. */
  writeTextSync(text: string, options?: Deno.WriteFileOptions): this {
    this.#withFileForWritingSync(options, (file) => {
      writeTextToFileSync(file, text);
    });
    return this;
  }

  /** Writes out the provided object as compact JSON. */
  async writeJson(
    obj: unknown,
    options?: Deno.WriteFileOptions,
  ): Promise<this> {
    const text = JSON.stringify(obj);
    await this.#writeTextWithEndNewLine(text, options);
    return this;
  }

  /** Synchronously writes out the provided object as compact JSON. */
  writeJsonSync(obj: unknown, options?: Deno.WriteFileOptions): this {
    const text = JSON.stringify(obj);
    this.#writeTextWithEndNewLineSync(text, options);
    return this;
  }

  /** Writes out the provided object as formatted JSON. */
  async writeJsonPretty(
    obj: unknown,
    options?: Deno.WriteFileOptions,
  ): Promise<this> {
    const text = JSON.stringify(obj, undefined, 2);
    await this.#writeTextWithEndNewLine(text, options);
    return this;
  }

  /** Synchronously writes out the provided object as formatted JSON. */
  writeJsonPrettySync(obj: unknown, options?: Deno.WriteFileOptions): this {
    const text = JSON.stringify(obj, undefined, 2);
    this.#writeTextWithEndNewLineSync(text, options);
    return this;
  }

  #writeTextWithEndNewLine(
    text: string,
    options: Deno.WriteFileOptions | undefined,
  ) {
    return this.#withFileForWriting(options, async (file) => {
      await writeTextToFile(file, text);
      await writeTextToFile(file, "\n");
    });
  }

  /** Appends the provided bytes to the file. */
  async append(
    data: Uint8Array,
    options?: Omit<Deno.WriteFileOptions, "append">,
  ): Promise<this> {
    await this.#withFileForAppending(options, (file) => file.write(data));
    return this;
  }

  /** Synchronously appends the provided bytes to the file. */
  appendSync(
    data: Uint8Array,
    options?: Omit<Deno.WriteFileOptions, "append">,
  ): this {
    this.#withFileForAppendingSync(options, (file) => {
      file.writeSync(data);
    });
    return this;
  }

  /** Appends the provided text to the file. */
  async appendText(
    text: string,
    options?: Omit<Deno.WriteFileOptions, "append">,
  ): Promise<this> {
    await this.#withFileForAppending(
      options,
      (file) => writeTextToFile(file, text),
    );
    return this;
  }

  /** Synchronously appends the provided text to the file. */
  appendTextSync(
    text: string,
    options?: Omit<Deno.WriteFileOptions, "append">,
  ): this {
    this.#withFileForAppendingSync(options, (file) => {
      writeTextToFileSync(file, text);
    });
    return this;
  }

  #withFileForAppending<T>(
    options: Omit<Deno.WriteFileOptions, "append"> | undefined,
    action: (file: Deno.FsFile) => Promise<T>,
  ) {
    return this.#withFileForWriting({
      append: true,
      ...options,
    }, action);
  }

  async #withFileForWriting<T>(
    options: Deno.WriteFileOptions | undefined,
    action: (file: Deno.FsFile) => Promise<T>,
  ) {
    const file = await this.#openFileMaybeCreatingDirectory({
      write: true,
      create: true,
      truncate: options?.append !== true,
      ...options,
    });
    try {
      return await action(file);
    } finally {
      try {
        file.close();
      } catch {
        // ignore
      }
    }
  }

  /** Opens a file, but handles if the directory does not exist. */
  async #openFileMaybeCreatingDirectory(options: Deno.OpenOptions) {
    const resolvedPath = this.resolve(); // pre-resolve before going async in case the cwd changes
    try {
      return await resolvedPath.open(options);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        // attempt to create the parent directory when it doesn't exist
        const parent = resolvedPath.parent();
        if (parent != null) {
          try {
            await parent.mkdir();
          } catch {
            throw err; // throw the original error
          }
        }
        return await resolvedPath.open(options);
      } else {
        throw err;
      }
    }
  }

  #writeTextWithEndNewLineSync(
    text: string,
    options: Deno.WriteFileOptions | undefined,
  ) {
    this.#withFileForWritingSync(options, (file) => {
      writeTextToFileSync(file, text);
      writeTextToFileSync(file, "\n");
    });
  }

  #withFileForAppendingSync<T>(
    options: Omit<Deno.WriteFileOptions, "append"> | undefined,
    action: (file: Deno.FsFile) => T,
  ) {
    return this.#withFileForWritingSync({
      append: true,
      ...options,
    }, action);
  }

  #withFileForWritingSync<T>(
    options: Deno.WriteFileOptions | undefined,
    action: (file: Deno.FsFile) => T,
  ) {
    const file = this.#openFileForWritingSync(options);
    try {
      return action(file);
    } finally {
      try {
        file.close();
      } catch {
        // ignore
      }
    }
  }

  /** Opens a file for writing, but handles if the directory does not exist. */
  #openFileForWritingSync(options: Deno.WriteFileOptions | undefined) {
    return this.#openFileMaybeCreatingDirectorySync({
      write: true,
      create: true,
      truncate: options?.append !== true,
      ...options,
    });
  }

  /** Opens a file for writing, but handles if the directory does not exist. */
  #openFileMaybeCreatingDirectorySync(options: Deno.OpenOptions) {
    try {
      return this.openSync(options);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        // attempt to create the parent directory when it doesn't exist
        const parent = this.resolve().parent();
        if (parent != null) {
          try {
            parent.mkdirSync();
          } catch {
            throw err; // throw the original error
          }
        }
        return this.openSync(options);
      } else {
        throw err;
      }
    }
  }

  /** Changes the permissions of the file or directory. */
  async chmod(mode: number): Promise<this> {
    await Deno.chmod(this.#path, mode);
    return this;
  }

  /** Synchronously changes the permissions of the file or directory. */
  chmodSync(mode: number): this {
    Deno.chmodSync(this.#path, mode);
    return this;
  }

  /** Changes the ownership permissions of the file. */
  async chown(uid: number | null, gid: number | null): Promise<this> {
    await Deno.chown(this.#path, uid, gid);
    return this;
  }

  /** Synchronously changes the ownership permissions of the file. */
  chownSync(uid: number | null, gid: number | null): this {
    Deno.chownSync(this.#path, uid, gid);
    return this;
  }

  /** Creates a new file or opens the existing one. */
  create(): Promise<Deno.FsFile> {
    return Deno.create(this.#path);
  }

  /** Synchronously creates a new file or opens the existing one. */
  createSync(): Deno.FsFile {
    return Deno.createSync(this.#path);
  }

  /** Creates a file throwing if a file previously existed. */
  createNew(): Promise<Deno.FsFile> {
    return this.open({
      createNew: true,
      read: true,
      write: true,
    });
  }

  /** Synchronously creates a file throwing if a file previously existed. */
  createNewSync(): Deno.FsFile {
    return this.openSync({
      createNew: true,
      read: true,
      write: true,
    });
  }

  /** Opens a file. */
  open(options?: Deno.OpenOptions): Promise<Deno.FsFile> {
    return Deno.open(this.#path, options);
  }

  /** Opens a file synchronously. */
  openSync(options?: Deno.OpenOptions): Deno.FsFile {
    return Deno.openSync(this.#path, options);
  }

  /** Removes the file or directory from the file system. */
  async remove(options?: Deno.RemoveOptions): Promise<this> {
    await Deno.remove(this.#path, options);
    return this;
  }

  /** Removes the file or directory from the file system synchronously. */
  removeSync(options?: Deno.RemoveOptions): this {
    Deno.removeSync(this.#path, options);
    return this;
  }

  /**
   * Copies the file to the specified destination path.
   * @returns The destination file path.
   */
  copyFile(destinationPath: string | URL | Path): Promise<Path> {
    const pathRef = ensurePath(destinationPath);
    return Deno.copyFile(this.#path, pathRef.#path)
      .then(() => pathRef);
  }

  /**
   * Copies the file to the destination path synchronously.
   * @returns The destination file path.
   */
  copyFileSync(destinationPath: string | URL | Path): Path {
    const pathRef = ensurePath(destinationPath);
    Deno.copyFileSync(this.#path, pathRef.#path);
    return pathRef;
  }

  /**
   * Copies the file to the specified directory.
   * @returns The destination file path.
   */
  copyFileToDir(destinationDirPath: string | URL | Path): Promise<Path> {
    const destinationPath = ensurePath(destinationDirPath)
      .join(this.basename());
    return this.copyFile(destinationPath);
  }

  /**
   * Copies the file to the specified directory synchronously.
   * @returns The destination file path.
   */
  copyFileToDirSync(destinationDirPath: string | URL | Path): Path {
    const destinationPath = ensurePath(destinationDirPath)
      .join(this.basename());
    return this.copyFileSync(destinationPath);
  }

  /**
   * Moves the file or directory returning a promise that resolves to
   * the renamed path.
   */
  rename(newPath: string | URL | Path): Promise<Path> {
    const pathRef = ensurePath(newPath);
    return Deno.rename(this.#path, pathRef.#path).then(() => pathRef);
  }

  /**
   * Moves the file or directory returning the renamed path synchronously.
   */
  renameSync(newPath: string | URL | Path): Path {
    const pathRef = ensurePath(newPath);
    Deno.renameSync(this.#path, pathRef.#path);
    return pathRef;
  }

  /**
   * Moves the file or directory to the specified directory.
   * @returns The destination file path.
   */
  renameToDir(destinationDirPath: string | URL | Path): Promise<Path> {
    const destinationPath = ensurePath(destinationDirPath)
      .join(this.basename());
    return this.rename(destinationPath);
  }

  /**
   * Moves the file or directory to the specified directory synchronously.
   * @returns The destination file path.
   */
  renameToDirSync(destinationDirPath: string | URL | Path): Path {
    const destinationPath = ensurePath(destinationDirPath)
      .join(this.basename());
    return this.renameSync(destinationPath);
  }

  /** Opens the file and pipes it to the writable stream. */
  async pipeTo(
    dest: WritableStream<Uint8Array>,
    options?: PipeOptions,
  ): Promise<this> {
    const file = await Deno.open(this.#path, { read: true });
    try {
      await file.readable.pipeTo(dest, options);
    } finally {
      try {
        file.close();
      } catch {
        // ignore
      }
    }
    return this;
  }
}

function ensurePath(path: string | URL | Path) {
  return path instanceof Path ? path : new Path(path);
}

async function notFoundToUndefined<T>(action: () => Promise<T>) {
  try {
    return await action();
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return undefined;
    } else {
      throw err;
    }
  }
}

function notFoundToUndefinedSync<T>(action: () => T) {
  try {
    return action();
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return undefined;
    } else {
      throw err;
    }
  }
}

async function writeTextToFile(file: Deno.FsFile, text: string) {
  const data = new TextEncoder().encode(text);
  let nwritten = 0;
  while (nwritten < data.length) {
    nwritten += await file.write(data.subarray(nwritten));
  }
}

function writeTextToFileSync(file: Deno.FsFile, text: string) {
  const data = new TextEncoder().encode(text);
  let nwritten = 0;
  while (nwritten < data.length) {
    nwritten += file.writeSync(data.subarray(nwritten));
  }
}
