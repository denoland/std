import { fileURLToPath } from "../url.ts";
import { Buffer } from "../buffer.ts";

export function toPathIfFileURL(
  fileURLOrPath: string | Buffer | URL,
): string | Buffer {
  if (!(fileURLOrPath instanceof URL)) {
    return fileURLOrPath;
  }
  return fileURLToPath(fileURLOrPath);
}

export default {
  toPathIfFileURL,
};
