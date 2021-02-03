/**
 * The test suite matches the folders inside the `test` folder inside the
 * node repo
 * 
 * Each test suite contains a list of files (which can be paths
 * or a regex to match) that will be pulled from the node repo
 */
type TestSuites = Record<string, string[]>;

interface Config {
  nodeVersion: string;
  /** Ignored files won't be run, deleted or updated by the update script */
  ignore: TestSuites;
  tests: TestSuites;
  suitesFolder: string;
  versionsFolder: string;
}

export async function getConfig(): Promise<Config> {
  return JSON.parse(
    await Deno.readTextFile(new URL("./config.json", import.meta.url)),
  );
}
