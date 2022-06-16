import { parse } from "../encoding/jsonc.ts";
import * as path from "../path/mod.ts";

export async function loadConfigFile(root: string) {
  let filePath = path.join(root, "deno.json");
  try {
    return JSON.parse(await Deno.readTextFile(filePath));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  filePath = path.join(root, "deno.jsonc");
  try {
    return parse(await Deno.readTextFile(filePath));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  throw new Deno.errors.NotFound();
}

export function loadConfigFileSync(root: string) {
  let filePath = path.join(root, "deno.json");
  try {
    return JSON.parse(Deno.readTextFileSync(filePath));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  filePath = path.join(root, "deno.jsonc");
  try {
    return parse(Deno.readTextFileSync(filePath));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  throw new Deno.errors.NotFound();
}
