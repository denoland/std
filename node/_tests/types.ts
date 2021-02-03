/**
 * The test suite matches the folders inside the `test` folder inside the
 * node repo
 * 
 * Each test suitecontains a list of files (which can be both string
 * and regex) that will be pulled from the node repo
 */
type TestSuites = Record<string, string[]>;

export interface Config {
  nodeVersion: string;
  /** Ignored files won't be run, deleted or updated by the update script */
  ignore: TestSuites;
  tests: TestSuites;
}
