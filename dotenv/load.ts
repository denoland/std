import { DenoEnv, parse } from "./mod.ts";

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
  let exampleSource;
  let defaultsSource;
  if (examplePath) exampleSource = Deno.readTextFileSync(examplePath);
  if (defaultsPath) defaultsSource = Deno.readTextFileSync(defaultsPath);
  const source = Deno.readTextFileSync(envPath);
  return configure(denoEnv, source, exampleSource, defaultsSource);
}

export async function load(
  denoEnv: DenoEnv,
  {
    envPath = ".env",
    examplePath,
    defaultsPath,
  }: LoadOptions = {},
) {
  let exampleSource;
  let defaultsSource;
  if (examplePath) exampleSource = await Deno.readTextFile(examplePath);
  if (defaultsPath) defaultsSource = await Deno.readTextFile(defaultsPath);
  const source = await Deno.readTextFile(envPath);
  return configure(denoEnv, source, exampleSource, defaultsSource);
}

function configure(
  denoEnv: DenoEnv,
  envSource: string,
  exampleSource?: string,
  defaultsSource?: string,
) {
  let example;
  let defaultEnv = {};
  if (exampleSource) example = parse(exampleSource);
  if (defaultsSource) defaultEnv = parse(defaultsSource).env;
  const object = parse(envSource, { example });
  // initialEnv is passed at the end of assign to prevent overwrites
  const initialEnv = denoEnv.toObject();
  const combinedObject: Record<string, string> = {
    ...defaultEnv,
    ...object.env,
    ...initialEnv,
  };
  Object.entries(combinedObject).forEach(([key, value]) =>
    denoEnv.set(key, value)
  );
  return denoEnv;
}
