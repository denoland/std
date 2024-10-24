import { PID } from '@/constants.ts'
interface SearchArgs {
  query: string
}
interface SearchResult {
  isolatePath: string
  functionName: string
  schema: string
}
interface ReadArgs {
  isolate: string
  commands?: string[]
  /** Read the functions object, and convert into a string */
  functions?: boolean
}
interface LoadArgs {
  /** The name of the isolate to load */
  isolate: string
  /** Which function to load within the isolate */
  functionName: string
  /** The address to target with the loaded function call */
  pid: PID
}
export type Api = {
  ls: () => Promise<string[]>
  /**
   * Response will be a list of the api functions that matched the query,
   * along with the isolate name.  The interpreting bot should then relate
   * what the function does to the caller with relevance to the search query
   * @param params
   * @returns
   */
  search: (params: SearchArgs) => Promise<SearchResult[]>
  read: (params: ReadArgs) => Promise<string[]>
  load: (params: LoadArgs) => Promise<void>
}

// can make this run only in the current repo, rather than being a cross repo
// thing ?

// TODO make it read the code from inside the isolates directory directly.

// What if we made a file browser that could browse the source code directly ?

// provide a files:readSystemFiles function that can read from the deployment
// for isolates it would be scoped to the isolates/ directory.

// then pull in the deploy logs into artifact too, so we can actually read them
// inside the browser, and parse them with AI watchers.
// Batch them up into manageable chunks.

// to make changes to the prompting of an isolate, it should be able to edit the
// repo source, then do a PR to get it deployed ?

// then the isolate call can be used to read in the json-schema directly, which
// the bot can then interpret as parameters for function calling, and can help
// with the prompting of the description.

// when reading the source, it can also check the relevance of the schema
// against the actual code.
