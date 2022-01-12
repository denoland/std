import { Buffer } from "../buffer.ts";

export function writeSync(fd, bufferLike, ...args) {
  const [buffer, pos] = bufferAndPos(bufferLike, args);
  if (typeof pos === "number") {
    Deno.seekSync(fd, pos, Deno.SeekMode.Start);
  }
  return Deno.writeSync(fd, buffer);
}

export function write(fd, bufferLike, ...args) {
  const cb = args[args.length - 1];
  const [buffer, pos] = bufferAndPos(bufferLike, args.slice(0, -1));

  async function innerWrite() {
    if (typeof pos === "number") {
      await Deno.seek(fd, pos, Deno.SeekMode.Start);
    }
    return await Deno.write(fd, buffer);
  }

  innerWrite().then(
    (n) => cb(null, n, bufferLike),
    (e) => cb(e, 0, bufferLike),
  );
}

function bufferAndPos(bufferLike, args) {
  if (typeof bufferLike === "string") {
    const [position, encoding] = args;
    return [Buffer.from(bufferLike, encoding), position];
  }

  const [offset, length, position] = args;
  return [Buffer.from(bufferLike, offset, length), position];
}
