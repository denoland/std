import { type DenoEnv, parse } from "./mod.ts";

export interface LoadOptions {
  envPath?: string | URL;
  examplePath?: string | URL;
  defaultsPath?: string | URL;
}

export async function load(
  denoEnv: DenoEnv = Deno.env,
  {
    envPath = ".env",
    examplePath = ".env.example",
    defaultsPath = ".env.defaults",
  }: LoadOptions = {},
) {
  let example;
  let defaultsEnv = {};
  try {
    const exampleSource = await Deno.readTextFile(examplePath);
    example = parse(exampleSource);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  try {
    const defaultsSource = await Deno.readTextFile(defaultsPath);
    defaultsEnv = parse(defaultsSource).env;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  const envSource = await Deno.readTextFile(envPath);

  const object = parse(envSource, { example });
  // initialEnv is passed at the end of assign to prevent overwrites
  const initialEnv = denoEnv.toObject();
  const env: Record<string, string> = {
    ...defaultsEnv,
    ...object.env,
    ...initialEnv,
  };
  Object.entries(env).forEach(([key, value]) => denoEnv.set(key, value));
  return denoEnv;
}
