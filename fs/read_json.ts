// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [member: string]: JSONValue };
export interface JSONArray extends Array<JSONValue> {}

/** Reads a JSON file and then parses it into an object */
export async function readJson(filePath: string): Promise<JSONValue> {
  const decoder = new TextDecoder("utf-8");

  const content = decoder.decode(await Deno.readFile(filePath));

  try {
    return JSON.parse(content);
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    throw err;
  }
}

/** Reads a JSON file and then parses it into an object */
export function readJsonSync(filePath: string): JSONValue {
  const decoder = new TextDecoder("utf-8");

  const content = decoder.decode(Deno.readFileSync(filePath));

  try {
    return JSON.parse(content);
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    throw err;
  }
}
