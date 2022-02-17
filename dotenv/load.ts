import { assign, DenoEnv, DotEnvObject, parse } from "./mod.ts";

export interface LoadOptions {
  envPath?: string | URL;
  examplePath?: string | URL;
  defaultsPath?: string | URL;
}

export function loadSync(
  denoEnv: DenoEnv,
  {
    envPath = ".env",
    examplePath = ".env.example",
    defaultsPath = ".env.defaults",
  }: LoadOptions = {},
) {
  const exampleSource = Deno.readTextFileSync(examplePath);
  const example = parse(exampleSource);
  const defaultsSource = Deno.readTextFileSync(defaultsPath);
  const defaults = parse(defaultsSource);
  const source = Deno.readTextFileSync(envPath);
  const object = parse(source, { example });
  return assign(denoEnv, defaults.env, object.env);
}

export async function load(
  denoEnv: DenoEnv,
  {
    envPath = ".env",
    examplePath,
    defaultsPath,
  }: LoadOptions = {},
) {
  let example: DotEnvObject = { env: {}, exports: [] };
  let defaults: DotEnvObject = { env: {}, exports: [] };
  if (examplePath) {
    const exampleSource = await Deno.readTextFile(examplePath);
    example = parse(exampleSource);
  }
  if (defaultsPath) {
    const defaultsSource = await Deno.readTextFile(defaultsPath);
    defaults = parse(defaultsSource);
  }
  const source = await Deno.readTextFile(envPath);
  const object = parse(source, { example });
  return assign(denoEnv, defaults.env, object.env);
}
