export function unlink(path: string | URL, callback: (err?: Error) => void) {
  if (!callback) throw new Error("No callback function supplied");
  Deno.remove(path).then((_) => callback(), callback);
}

export function unlinkSync(path: string | URL) {
  try {
    Deno.removeSync(path);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      e.code = "ENOENT";
    }
    throw e;
  }
}
