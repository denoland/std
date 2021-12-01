import { fileURLToPath } from "../url.ts";

export function toPathIfFileURL(fileURLOrPath: string | URL) {
  if (!(fileURLOrPath instanceof URL)) {
    return fileURLOrPath;
  }
  return fileURLToPath(fileURLOrPath);
}

export default {
  toPathIfFileURL,
};
